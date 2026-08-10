// The shipping Mini Game reaches the room server through the private WeChat
// Cloud Hosting protocol. This AppID-bound route does not use a public WSS
// domain and therefore does not depend on the server-domain allowlist.
if (globalThis.__WIZZARD_APP_RUNTIME_CONFIG__ === undefined) {
  globalThis.__WIZZARD_APP_RUNTIME_CONFIG__ = {
    friendRoom: {
      environmentId: "prod-d9g3qr6rqdbba6605",
      path: "/ws",
      serviceName: "wizzard-room-server",
      transport: "wechat-cloud-container",
    },
    startup: "home",
  };
}

function __initApp() {
  const info = wx.getSystemInfoSync();

  // Cocos normally follows the reported device pixel ratio. WeChat DevTools
  // can report 1x for its landscape simulator, which makes every sprite and
  // TTF label look jagged even though production phones render at 2x/3x.
  // Supersample only that simulator case; real devices keep their native DPR.
  const reportedDpr = Number(
    info.pixelRatio ??
      info.devicePixelRatio ??
      (typeof window !== "undefined" ? window.devicePixelRatio : undefined) ??
      globalThis.devicePixelRatio ??
      1,
  );
  const isDevtools = String(info.platform ?? "").toLowerCase() === "devtools";
  const renderDpr = Math.min(3, Math.max(isDevtools ? 2 : 1, reportedDpr));

  // Cocos reads wx.getSystemInfoSync()/getWindowInfo again while its screen
  // adapter is initialized. If DevTools reports 1x, only enlarging the
  // canvas here is not enough: Cocos would immediately resize it back to 1x.
  // Keep the logical viewport unchanged but make every later engine query
  // observe the same supersampled DPR.
  if (isDevtools && renderDpr > reportedDpr) {
    const patchDprReader = (name) => {
      const reader = wx[name];
      if (typeof reader !== "function") {
        return;
      }
      wx[name] = function patchedDprReader() {
        const nextInfo = reader.call(this);
        return {
          ...nextInfo,
          devicePixelRatio: renderDpr,
          pixelRatio: renderDpr,
        };
      };
    };
    patchDprReader("getSystemInfoSync");
    patchDprReader("getWindowInfo");
    try {
      if (typeof window !== "undefined") {
        window.devicePixelRatio = renderDpr;
      } else {
        globalThis.devicePixelRatio = renderDpr;
      }
    } catch {
      // Some DevTools versions expose devicePixelRatio as read-only.
    }
  }

  // web-adapter.js snapshots wx.getSystemInfoSync() and window.devicePixelRatio
  // as it is loaded. Apply the compatibility layer before requiring it, or the
  // adapter keeps the simulator's original 1x value for the rest of the boot.
  globalThis.__wxRequire = require;
  require("./web-adapter");
  const firstScreen = require("./first-screen");

  require("src/polyfills.bundle.js");
  require("src/system.bundle.js");

  if (canvas) {
    let width = canvas.width;
    let height = canvas.height;
    if (info.screenWidth < info.screenHeight) {
      if (canvas.width > canvas.height) {
        width = canvas.height;
        height = canvas.width;
      }
    } else if (canvas.width < canvas.height) {
      width = canvas.height;
      height = canvas.width;
    }
    canvas.width = width;
    canvas.height = height;
  }

  if (canvas && renderDpr >= 2) {
    // The template can be evaluated more than once while DevTools recompiles
    // a project. Keep the logical size from the first pass so a hot reload
    // cannot turn 2x into 4x (or 3x into 9x).
    const baseWidth = Number(canvas.__wizzardBaseWidth ?? canvas.width);
    const baseHeight = Number(canvas.__wizzardBaseHeight ?? canvas.height);
    canvas.__wizzardBaseWidth = baseWidth;
    canvas.__wizzardBaseHeight = baseHeight;
    canvas.width = Math.round(baseWidth * renderDpr);
    canvas.height = Math.round(baseHeight * renderDpr);
    canvas.__wizzardRenderDpr = renderDpr;
  }

  const importMap = require("src/import-map.js").default;
  System.warmup({
    importMap,
    importMapUrl: "src/import-map.js",
    defaultHandler: (urlNoSchema) => {
      require("." + urlNoSchema);
    },
    handlers: {
      "plugin:": (urlNoSchema) => {
        requirePlugin(urlNoSchema);
      },
      "project:": (urlNoSchema) => {
        require(urlNoSchema);
      },
    },
  });

  firstScreen
    .start("default", "default", "false")
    .then(() => System.import("./application.js"))
    .then((module) =>
      firstScreen.setProgress(0.2).then(() => Promise.resolve(module)),
    )
    .then(({ Application }) => new Application())
    .then((application) =>
      firstScreen.setProgress(0.4).then(() => Promise.resolve(application)),
    )
    .then((application) => onApplicationCreated(application))
    .catch((error) => {
      console.error(error);
    });

  function onApplicationCreated(application) {
    return System.import("cc")
      .then((module) =>
        firstScreen.setProgress(0.6).then(() => Promise.resolve(module)),
      )
      .then((cc) => {
        require("./engine-adapter");
        return application.init(cc);
      })
      .then(() => firstScreen.end().then(() => application.start()));
  }
}

// On WeChat Android the correct screen size is available one frame later.
const systemInfo = wx.getSystemInfoSync();
if (String(systemInfo.platform).toLowerCase() === "android") {
  GameGlobal.requestAnimationFrame(__initApp);
} else {
  __initApp();
}
