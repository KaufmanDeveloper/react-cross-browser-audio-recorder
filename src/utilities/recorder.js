(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Recorder = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
    "use strict";
    
    module.exports = require("./recorder").Recorder;
    
    },{"./recorder":2}],2:[function(require,module,exports){
    'use strict';
    
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.Recorder = undefined;
    
    var _createClass = function () {
        function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
                var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
            }
        }return function (Constructor, protoProps, staticProps) {
            if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
        };
    }();
    
    var _inlineWorker = require('inline-worker');
    
    var _inlineWorker2 = _interopRequireDefault(_inlineWorker);
    
    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
    }
    
    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }
    
    var Recorder = exports.Recorder = function () {
        function Recorder(source, cfg) {
            var _this = this;
    
            _classCallCheck(this, Recorder);
    
            this.config = {
                bufferLen: 4096,
                numChannels: 2,
                mimeType: 'audio/wav'
            };
            this.recording = false;
            this.callbacks = {
                getBuffer: [],
                getCurrentBuffer: [],
                getAudioLossInfo: [],
                exportWAV: []
            };
    
            Object.assign(this.config, cfg);
            this.context = source.context;
            this.node = (this.context.createScriptProcessor || this.context.createJavaScriptNode).call(this.context, this.config.bufferLen, this.config.numChannels, this.config.numChannels);
    
            this.expectedBufferTime = this.config.bufferLen / this.context.sampleRate * 1000; // in milliseconds
            this.audioProcessStartTime = null;
            this.audioProcessEndTime = null;
            this.totalNumberOfBuffers = 0;
            this.lossOccurrences = 0;
            // default acceptable delay is twice the expected buffer time (ms)
            this.acceptableDelay = this.config.acceptableDelay == null ? this.expectedBufferTime * -2 : this.config.acceptableDelay * -1;
            this.node.onaudioprocess = function (e) {
                if (!_this.recording) return;
    
                if (_this.audioProcessStartTime) {
                    _this.totalNumberOfBuffers += 1;
                    _this.audioProcessEndTime = performance.now();
    
                    var timeToNewAudioProcess = _this.audioProcessEndTime - _this.audioProcessStartTime;
                    var difference = _this.expectedBufferTime - timeToNewAudioProcess;
    
                    if (difference < _this.acceptableDelay) {
                        _this.lossOccurrences += 1;
                    }
                }
    
                var buffer = [];
                for (var channel = 0; channel < _this.config.numChannels; channel++) {
                    buffer.push(e.inputBuffer.getChannelData(channel));
                }
                _this.worker.postMessage({
                    command: 'record',
                    buffer: buffer
                });
    
                _this.audioProcessStartTime = performance.now();
            };
    
            source.connect(this.node);
            this.node.connect(this.context.destination); //this should not be necessary
    
            var self = {};
            this.worker = new _inlineWorker2.default(function () {
                var recLength = 0,
                    recBuffers = [],
                    currentBuffer = [],
                    sampleRate = void 0,
                    numChannels = void 0;
    
                this.onmessage = function (e) {
                    switch (e.data.command) {
                        case 'init':
                            init(e.data.config);
                            break;
                        case 'record':
                            record(e.data.buffer);
                            break;
                        case 'exportWAV':
                            exportWAV(e.data.type);
                            break;
                        case 'getBuffer':
                            getBuffer();
                            break;
                        case 'getCurrentBuffer':
                            getCurrentBuffer();
                            break;
                        case 'getAudioLossInfo':
                            getAudioLossInfo(e.data.audioLossInfo);
                            break;
                        case 'clear':
                            clear();
                            break;
                    }
                };
    
                function init(config) {
                    sampleRate = config.sampleRate;
                    numChannels = config.numChannels;
                    initBuffers();
                }
    
                function record(inputBuffer) {
                    for (var channel = 0; channel < numChannels; channel++) {
                        recBuffers[channel].push(inputBuffer[channel]);
                        currentBuffer[channel] = inputBuffer[channel];
                    }
                    recLength += inputBuffer[0].length;
                }
    
                function exportWAV(type) {
                    var buffers = [];
                    for (var channel = 0; channel < numChannels; channel++) {
                        buffers.push(mergeBuffers(recBuffers[channel], recLength));
                    }
                    var interleaved = void 0;
                    if (numChannels === 2) {
                        interleaved = interleave(buffers[0], buffers[1]);
                    } else {
                        interleaved = buffers[0];
                    }
                    var dataview = encodeWAV(interleaved);
                    var audioBlob = new Blob([dataview], { type: type });
    
                    this.postMessage({ command: 'exportWAV', data: audioBlob });
                }
    
                function getBuffer() {
                    var buffers = [];
                    for (var channel = 0; channel < numChannels; channel++) {
                        buffers.push(mergeBuffers(recBuffers[channel], recLength));
                    }
                    this.postMessage({ command: 'getBuffer', data: buffers });
                }
    
                function getCurrentBuffer() {
                    var buffers = [];
                    for (var channel = 0; channel < numChannels; channel++) {
                        buffers.push(currentBuffer[channel]);
                    }
                    this.postMessage({ command: 'getCurrentBuffer', data: buffers });
                }
    
                function getAudioLossInfo(audioLossInfo) {
                    this.postMessage({
                        command: 'getAudioLossInfo',
                        data: audioLossInfo
                    });
                }
    
                function clear() {
                    recLength = 0;
                    recBuffers = [];
                    currentBuffer = [];
                    initBuffers();
                }
    
                function initBuffers() {
                    for (var channel = 0; channel < numChannels; channel++) {
                        recBuffers[channel] = [];
                        currentBuffer[channel] = [];
                    }
                }
    
                function mergeBuffers(recBuffers, recLength) {
                    var result = new Float32Array(recLength);
                    var offset = 0;
                    for (var i = 0; i < recBuffers.length; i++) {
                        result.set(recBuffers[i], offset);
                        offset += recBuffers[i].length;
                    }
                    return result;
                }
    
                function interleave(inputL, inputR) {
                    var length = inputL.length + inputR.length;
                    var result = new Float32Array(length);
    
                    var index = 0,
                        inputIndex = 0;
    
                    while (index < length) {
                        result[index++] = inputL[inputIndex];
                        result[index++] = inputR[inputIndex];
                        inputIndex++;
                    }
                    return result;
                }
    
                function floatTo16BitPCM(output, offset, input) {
                    for (var i = 0; i < input.length; i++, offset += 2) {
                        var s = Math.max(-1, Math.min(1, input[i]));
                        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
                    }
                }
    
                function writeString(view, offset, string) {
                    for (var i = 0; i < string.length; i++) {
                        view.setUint8(offset + i, string.charCodeAt(i));
                    }
                }
    
                function encodeWAV(samples) {
                    var buffer = new ArrayBuffer(44 + samples.length * 2);
                    var view = new DataView(buffer);
    
                    /* RIFF identifier */
                    writeString(view, 0, 'RIFF');
                    /* RIFF chunk length */
                    view.setUint32(4, 36 + samples.length * 2, true);
                    /* RIFF type */
                    writeString(view, 8, 'WAVE');
                    /* format chunk identifier */
                    writeString(view, 12, 'fmt ');
                    /* format chunk length */
                    view.setUint32(16, 16, true);
                    /* sample format (raw) */
                    view.setUint16(20, 1, true);
                    /* channel count */
                    view.setUint16(22, numChannels, true);
                    /* sample rate */
                    view.setUint32(24, sampleRate, true);
                    /* byte rate (sample rate * block align) */
                    view.setUint32(28, sampleRate * 4, true);
                    /* block align (channel count * bytes per sample) */
                    view.setUint16(32, numChannels * 2, true);
                    /* bits per sample */
                    view.setUint16(34, 16, true);
                    /* data chunk identifier */
                    writeString(view, 36, 'data');
                    /* data chunk length */
                    view.setUint32(40, samples.length * 2, true);
    
                    floatTo16BitPCM(view, 44, samples);
    
                    return view;
                }
            }, self);
    
            this.worker.postMessage({
                command: 'init',
                config: {
                    sampleRate: this.context.sampleRate,
                    numChannels: this.config.numChannels
                }
            });
    
            this.worker.onmessage = function (e) {
                var cb = _this.callbacks[e.data.command].pop();
                if (typeof cb == 'function') {
                    cb(e.data.data);
                }
            };
        }
    
        _createClass(Recorder, [{
            key: 'record',
            value: function record() {
                this.recording = true;
                this.audioProcessStartTime = performance.now();
            }
        }, {
            key: 'stop',
            value: function stop() {
                this.recording = false;
            }
        }, {
            key: 'clear',
            value: function clear() {
                this.totalNumberOfBuffers = 0;
                this.lossOccurrences = 0;
                this.worker.postMessage({ command: 'clear' });
            }
        }, {
            key: 'getBuffer',
            value: function getBuffer(cb) {
                cb = cb || this.config.callback;
                if (!cb) throw new Error('Callback not set');
    
                this.callbacks.getBuffer.push(cb);
    
                this.worker.postMessage({ command: 'getBuffer' });
            }
        }, {
            key: 'getCurrentBuffer',
            value: function getCurrentBuffer(cb) {
                cb = cb || this.config.callback;
                if (!cb) throw new Error('Callback not set');
    
                this.callbacks.getCurrentBuffer.push(cb);
    
                this.worker.postMessage({ command: 'getCurrentBuffer' });
            }
        }, {
            key: 'getAudioLossInfo',
            value: function getAudioLossInfo(cb) {
                cb = cb || this.config.callback;
                if (!cb) throw new Error('Callback not set');
    
                this.callbacks.getAudioLossInfo.push(cb);
    
                this.worker.postMessage({
                    command: 'getAudioLossInfo',
                    audioLossInfo: {
                        numberOfBuffers: this.totalNumberOfBuffers,
                        numberOfLosses: this.lossOccurrences
                    }
                });
            }
        }, {
            key: 'exportWAV',
            value: function exportWAV(cb, mimeType) {
                mimeType = mimeType || this.config.mimeType;
                cb = cb || this.config.callback;
                if (!cb) throw new Error('Callback not set');
    
                this.callbacks.exportWAV.push(cb);
    
                this.worker.postMessage({
                    command: 'exportWAV',
                    type: mimeType
                });
            }
        }], [{
            key: 'forceDownload',
            value: function forceDownload(blob, filename) {
                var url = (window.URL || window.webkitURL).createObjectURL(blob);
                var link = window.document.createElement('a');
                link.href = url;
                link.download = filename || new Date().toISOString() + '.wav';
                var click = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
    
                var cancelled = !link.dispatchEvent(click);
                if (cancelled) {
                    console.log("download cancelled: A handler called preventDefault.");
                } else {
                    console.log("download successful: None of the handlers called preventDefault");
                }
            }
        }]);
    
        return Recorder;
    }();
    
    exports.default = Recorder;
    
    },{"inline-worker":3}],3:[function(require,module,exports){
    "use strict";
    
    module.exports = require("./inline-worker");
    },{"./inline-worker":4}],4:[function(require,module,exports){
    (function (global){
    "use strict";
    
    var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
    
    var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };
    
    var WORKER_ENABLED = !!(global === global.window && global.URL && global.Blob && global.Worker);
    
    var InlineWorker = (function () {
      function InlineWorker(func, self) {
        var _this = this;
    
        _classCallCheck(this, InlineWorker);
    
        if (WORKER_ENABLED) {
          var functionBody = func.toString().trim().match(/^function\s*\w*\s*\([\w\s,]*\)\s*{([\w\W]*?)}$/)[1];
          var url = global.URL.createObjectURL(new global.Blob([functionBody], { type: "text/javascript" }));
    
          return new global.Worker(url);
        }
    
        this.self = self;
        this.self.postMessage = function (data) {
          setTimeout(function () {
            _this.onmessage({ data: data });
          }, 0);
        };
    
        setTimeout(function () {
          func.call(self);
        }, 0);
      }
    
      _createClass(InlineWorker, {
        postMessage: {
          value: function postMessage(data) {
            var _this = this;
    
            setTimeout(function () {
              _this.self.onmessage({ data: data });
            }, 0);
          }
        }
      });
    
      return InlineWorker;
    })();
    
    module.exports = InlineWorker;
    }).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
    },{}]},{},[1])(1)
    });