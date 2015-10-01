(function () {

'use strict';

function getUrlParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function isCrossDomain() {
   function isInIframe() {
      try {
         return window.self !== window.top;
      } catch (e) {
         return false;
      }
   }
   function isSameDomain() {
      var res = false;
      function doNothing(document){}
      try{
          res = !! parent.document.TaskProxyManager;
      } catch(e){
          res = false;
      }
      return res;
   }
   return isInIframe() && !isSameDomain();
}

var platform;

if (!isCrossDomain()) {

   /* Implementation of a platform proxy for the task iframe. This object is always
    * available, but is effective only when setPlatform is called with a true
    * platform object.
    */

   platform = {
      registered_objects: [],
      parent_platform: null,
      setPlatform: function(platformArg) {
         platform.parent_platform = platformArg;
      },
      trigger: function(event, content) {
         for (var object in this.registered_objects) {
            if (typeof (object[event]) != "undefined") {
               object[event].apply(object, content);
            }
         }
      },
      subscribe: function(object) {
         this.registered_objects.push(object);
      },
      unsubscribe: function(object) {
         var index = this.registered_objects.indexOf(object);
         if (index != -1) {
            this.registered_objects.splice(index, 1);
         }
      },
      validate: function(mode, success, error) {
         // TODO: this case is a bit blur...
         var res = platform.parent_platform.validate(mode, success, error);
         this.trigger('validate', [mode]);
         return res;
      },
      showView: function(views, success, error) {
         return platform.parent_platform.showView(views, success, error);
      },
      askHint: function(platformToken, success, error) {
         return platform.parent_platform.askHint(platformToken, success, error);
      },
      updateHeight: function(height, success, error) {
         return platform.parent_platform.updateHeight(height, success, error);
      },
      getTaskParams: function(key, defaultValue, success, error) {
         return platform.parent_platform.getTaskParams(key, defaultValue, success, error);
      },
      openUrl: function(url, success, error) {
         return platform.parent_platform.openUrl(url, success, error);
      },
      initWithTask: function(task) {
         platform.task = task;
         window.task = task;
      }
   };

} else {

   // cross-domain version, depends on jschannel

   var callAndTrigger = function(fun, triggerName) {
      return function() {
         platform.trigger(triggerName, arguments);
         fun(arguments);
      };
   };
   platform = {};
   platform.ready = false;
   platform.initWithTask = function(task) {
      var channelId = getUrlParameterByName('channelId');
      var chan = Channel.build({window: window.parent, origin: "*", scope: channelId});
      platform.chan = chan;
      platform.task = task;
      window.task = task;
      platform.channelId = channelId;
      chan.bind('task.load', function(trans, views) {task.load(views, callAndTrigger(trans.complete, 'load'), trans.error);trans.delayReturn(true);});
      chan.bind('task.unload', function(trans) {task.unload(callAndTrigger(trans.complete, 'unload'), trans.error);trans.delayReturn(true);});
      chan.bind('task.getHeight', function(trans) {task.getHeight(trans.complete, trans.error);trans.delayReturn(true);});
      chan.bind('task.getMetaData', function(trans) {task.getMetaData(trans.complete, trans.error);trans.delayReturn(true);});
      chan.bind('task.getViews', function(trans) {task.getViews(trans.complete, trans.error);trans.delayReturn(true);});
      chan.bind('task.showViews', function(trans, views) {task.showViews(views, callAndTrigger(trans.complete, 'showViews'), trans.error);trans.delayReturn(true);});
      chan.bind('task.updateToken', function(trans, token) {task.updateToken(token, trans.complete, trans.error);trans.delayReturn(true);});
      chan.bind('task.reloadAnswer', function(trans, answer) {task.reloadAnswer(answer, callAndTrigger(trans.complete, 'reloadAnswer'), trans.error);trans.delayReturn(true);});
      chan.bind('task.getAnswer', function(trans) {task.getAnswer(trans.complete, trans.error);trans.delayReturn(true);});
      chan.bind('task.getState', function(trans) {task.getState(trans.complete, trans.error);trans.delayReturn(true);});
      chan.bind('task.reloadState', function(trans, state) {task.reloadState(state, callAndTrigger(trans.complete, 'reloadState'), trans.error);trans.delayReturn(true);});
      platform.ready = true;
   };

   platform.registered_objects = {};
   platform.trigger = function(event, content) {
      for (var object in platform.registered_objects) {
         if (typeof (object[event]) != "undefined") {
            object[event].apply(object, content);
         }
      }
   };
   platform.subscribe = function(object) {
      platform.registered_objects.push(object);
   };
   platform.unsubscribe = function(object) {
      var index = platform.registered_objects.indexOf(object);
      if (index != -1) {
         platform.registered_objects.splice(index, 1);
      }
   };
   platform.stop = function() {
      platform.chan.destroy(); 
   };
   platform.validate = function (sMode, success, error) {
      if (!success) success = function(){}; // not mandatory, as most code doesn't use it
      if (!error) error = function() {console.error(arguments)};
      platform.chan.call({method: "platform.validate",
         params: sMode,
         error: error,
         success: callAndTrigger(success)
      });
   };
   platform.getTaskParams = function(key, defaultValue, success, error) {
      if (!success) success = function(){};
      if (!error) error = function() {console.error(arguments)};
      platform.chan.call({method: "platform.getTaskParams",
         params: [key, defaultValue],
         error: error,
         success: success
      });
   };
   platform.showView = function(views, success, error) {
      if (!success) success = function(){};
      if (!error) error = function() {console.error(arguments)};
      platform.chan.call({method: "platform.showView",
         params: views,
         error: error,
         success: success
      });
   };
   platform.askHint = function(platformToken, success, error) {
      if (!success) success = function(){};
      if (!error) error = function() {console.error(arguments)};
      platform.chan.call({method: "platform.askHint",
         params: platformToken,
         error: error,
         success: success
      });
   };
   platform.updateHeight = function(height, success, error) {
      if (!success) success = function(){};
      if (!error) error = function() {console.error(arguments)};
      platform.chan.call({method: "platform.updateHeight",
         params: height,
         error: error,
         success: success
      });
   };
   platform.openUrl = function(url, success, error) {
      if (!success) success = function(){};
      if (!error) error = function() {console.error(arguments)};
      platform.chan.call({method: "platform.openUrl",
         params: url,
         error: error,
         success: success
      });
   };
}

window.platform = platform;

}());
