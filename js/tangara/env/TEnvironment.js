define(['jquery'], function($) {
     /**
     * TEnvironment defines the environment variables (language, project,
     * and project's availability), 
     * @class
     * @returns {TEnvironment}
     */
    var TEnvironment = function() {
        var project;
        var projectAvailable = false;
        var support3D = null;

        this.messages = {};

        // TODO: change this
        this.language = "fr";

        // Config parameters: default values
        this.config = {"debug": false, "backend-path": "/tangara-ui/web/app.php/"};
        this.debug;

        /**
         * Loads environment (config, messages), and calls callback if existing
         * @param {Function} callback
         */
        this.load = function(callback) {
            window.console.log("*** Loading Tangara Environment ***");
            window.console.log("* Loading config");
            var configFile = this.getResource("config.json");
            var self = this;
            $.ajax({
                dataType: "json",
                url: configFile,
                success: function(data) {
                    $.extend(self.config, data);
                    self.debug = self.config['debug'];
                    if (self.config['document-domain']) {
                        document.domain = self.config['document-domain'];
                    }
                    window.console.log("* Retrieving translated messages");
                    var messageFile = self.getResource("messages.json");
                    window.console.log("getting messages from: " + messageFile);
                    var language = self.language;
                    $.ajax({
                        dataType: "json",
                        url: messageFile,
                        success: function(data) {
                            if (typeof data[language] !== 'undefined') {
                                self.messages = data[language];
                                window.console.log("found messages in language: " + language);
                            } else {
                                window.console.log("found no messages for language: " + language);
                            }
                            if (typeof callback !== 'undefined') {
                                callback.call(self);
                            }
                        }
                    });
                    
                }
            });
        };

        /**
         * Get the base URL
         * @returns {String}
         */
        this.getBaseUrl = function() {
            return window.location.protocol + "//" + window.location.host + window.location.pathname.split("/").slice(0, -1).join("/");
        };

        /**
         * Get the URL of objects
         * @returns {String}
         */
        this.getObjectsUrl = function() {
            return this.getBaseUrl() + "/js/tangara/objects";
        };

        /**
         * Get the URL of the list of objects
         * @returns {String}
         */
        this.getObjectListUrl = function() {
            return this.getObjectsUrl() + "/objects.json";
        };

        /**
         * Get the URL of the module entered in parameter
         * @param {String} module
         * @returns {String}
         */
        this.getBackendUrl = function(module) {
            var url = window.location.protocol + "//" + window.location.host + window.location.pathname.split("/").slice(0, -2).join("/");
            url += this.config['backend-path'] + "assets/";
            if (typeof module !== "undefined") {
                url = url + module;
            }
            return url;
        };

        /**
         * Get language
         * @returns {String}
         */
        this.getLanguage = function() {
            return this.language;
        };

        /**
         * Set language to the one entered in parameter
         * @param {String} language
         */
        this.setLanguage = function(language) {
            this.language = language;
        };

        /**
         * Get URL of the resource entered in parameter
         * @param {String} name
         * @returns {String}
         */
        this.getResource = function(name) {
            return this.getBaseUrl() + "/resources/" + name;
        };

        /**
         * Get resource entered in parameter of var project
         * @param {String} name
         * @returns {unresolved}
         */
        this.getProjectResource = function(name) {
            return project.getResourceLocation(name);
        };

        /**
         * Get a message. There are two possibilities :
         * - A message is associated in the array of messages. If there's more
         *   than one variable entered in parameters, other variables
         *   are replaced in the associated message. This message is returned.
         * - The paramater isn't associated to any message. It is returned.
         * @param {type} code
         * @returns {String}
         */
        this.getMessage = function(code) {
            if (typeof this.messages[code] !== 'undefined') {
                var message = this.messages[code];
                if (arguments.length > 1) {
                    // message has to be parsed
                    var elements = arguments;
                    message = message.replace(/{(\d+)}/g, function(match, number) {
                        number = parseInt(number) + 1;
                        return typeof elements[number] !== 'undefined' ? elements[number] : match;
                    });
                }
                return message;
            } else {
                return code;
            }
        };

        /**
         * Set the project to the one entered in parameter
         * @param {String} value
         */
        this.setProject = function(value) {
            project = value;
        };

        /**
         * Get the current project
         * @returns {String}
         */
        this.getProject = function() {
            return project;
        };

        /**
         * Set the avaibility of the project
         * @param {Boolean} value
         */
        this.setProjectAvailable = function(value) {
            projectAvailable = value;
        };

        /**
         * Get the avaibility of the project
         * @returns {Boolean} 
         */
        this.isProjectAvailable = function() {
            return projectAvailable;
        };

        /**
         * Get the configuration of the value entered in parameter
         * @param {String} value
         * @returns {object}
         */
        this.getConfig = function(value) {
            return this.config[value];
        };

        /**
         * Checks the suppport of 3D and write a message in log
         * @returns {Boolean}
         */
        this.is3DSupported = function() {
            var canvas, gl;
            if (support3D !== null)
                return support3D;
            try {
                canvas = document.createElement('canvas');
                gl = canvas.getContext('webgl');
            } catch (e) {
                gl = null;
            }
            if (gl === null) {
                try {
                    gl = canvas.getContext("experimental-webgl");
                }
                catch (e) {
                    gl = null;
                }
            }
            if (gl === null) {
                support3D = false;
                console.log("3D functions not supported");
            } else {
                support3D = true;
                console.log("3D functions supported");
            }
            return support3D;
        };
    };

    var environmentInstance = new TEnvironment();

    return environmentInstance;
});


