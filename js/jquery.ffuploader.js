/*
 * jQuery file uploader plugin v 1.1 
 * https://github.com/fr33land/jquery-file-uploader
 * 
 * Author: Rokas Sabaliauskas(fr33land) 
 * Email: rrokass@gmail.com 
 *  
 * Copyright 2018
 * Licensed under the MIT license. 
 * http://www.opensource.org/licenses/mit-license.php 
 */

(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(['jquery'], factory);
  } else if (typeof module === 'object' && module.exports) {
    factory(require('jquery'));
  } else {
    // Browser globals
    factory(jQuery);
  }
}
(function ($, window, document, undefined) {

  "use strict";
  var pluginName = "ffUploader";
  var defaults = {
    maxFileCount: 5,
    maxFileSize: 10,
    fileSizeMetric: 'M',
    browseButtonCaption: "Browse",
    allowedExtensions: [],
    extensionMaxFileSize: []
  };

  var fileSizeMultipliers = {
    K: 1024,
    M: 1048576,
    G: 1073741824,
    T: 1099511627776
  };

  var fileType2ExtensionMap = {
    "application/pdf": ["pdf"],
    "image/png": ["png"],
    "image/jpeg": ["jpg", "jpeg"],
    "image/gif": ["gif"],
    "image/bmp": ["bmp"],
    "application/msword": ["doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
    "adoc": ["adoc"]
  };

  function FFUploader(element, options) {
    var self = this;
    this.element = element;
    this.options = $.extend({}, defaults, options);
    this._defaults = defaults;
    this._name = pluginName;
    this._ffUploader = {};
    this._fileListDiv = {};
    this._files = [];
    this._fileCount = 0;
    this._fileBrowserDiv = {};
    this._fileInput = {};
    this._browseButton = {};
    this.init();

    function getFileList() {
      return self._files;
    }

    function addFileToListing(id, file) {
      self.addFileToListing(id, file);
    }

    function removeFileFromListing(fileNo, item) {
      self.removeFileFromListing(fileNo, item);
    }

    function addFileToList(file) {
      self.addFileToList(self, file);
    }

    function disable() {
      $(self.element).prop("disabled", true);
      self._browseButton.prop("disabled", true);
    }

    function enable() {
      $(self.element).prop("disabled", false);
      self._browseButton.prop("disabled", false);
    }
    return {
      getFileList: getFileList,
      addFileToListing: addFileToListing,
      addFileToList: addFileToList,
      removeFileFromListing: removeFileFromListing,
      disable: disable,
      enable: enable
    };
  }

  $.extend(FFUploader.prototype, {
    init: function () {
      var c = this;
      $(this.element).css('display', 'none');
      this._ffUploader = $('<div class="ff-uploader" style="width: auto">').insertAfter(this.element);
      this._fileBrowserDiv = $('<div class="ff-uploader-browser">');
      this._fileListDiv = $('<div class="ff-uploader-files" style="width: 120px">');
      this._ffUploader.append(this._fileBrowserDiv);
      this._ffUploader.append(this._fileListDiv);

      this._fileInput = $("<input>").attr({
        type: "file",
        id: this.element.id + "_ff-browser",
        name: this.element.name + "_ff-browser",
        style: "display:none",
        accept: (this.options.allowedExtensions.map(this.addDot)).join()
      });
      this._fileInput.appendTo(this._fileBrowserDiv);

      this._browseButton = $('<button>').attr({
        type: 'button',
        id: this.element.id + '_ff-browser-button',
        name: this.element.name + '_ff-browser-button',
        class: 'button btn upload_button'
      });
      this._browseButton.append(c.options.browseButtonCaption);
      this._browseButton.appendTo(this._fileBrowserDiv);

      this._fileList = $('<ul/>').attr({
        class: 'ff-uploader-files-list'
      });
      this._fileList.appendTo(this._fileListDiv);


      this._browseButton.on("click", function (e) {
        c._fileInput.trigger("click");
      });

      this._fileInput.on("change", function (e) {
        var fileAdded = c.addFileToList(c, e.target.files[0]);
        if (!fileAdded) {
          this.value = '';
        }
      });

    },
    addDot: function (element) {
      return "." + element;
    },
    addFileToList: function (c, file) {
      if (this.checkFileExists(file))
        return false;

      if (this.checkFileExtension(file))
        return false;

      if (this.options.extensionMaxFileSize) {
        if (this.checkFileSizeExceedByExtension(file))
          return false;
      } else {
        if (this.checkFileSizeExceed(file))
          return false;
      }

      var fileItem = $("<li class='ff-uploader-list-item' data-no=" + this._fileCount + "><div class='ff-uploader-file-remove-icon'></div> <span class='ff-uploader-list-item-text'>" + file.name + "</span></li>");
      $(fileItem).children("div.ff-uploader-file-remove-icon").on("click", function () {
        c.removeFileFromList($(fileItem).data("no"), this);
      });
      this._fileList.append(fileItem).hide().fadeIn(150);
      this._files[this._fileCount] = file;
      this._fileCount++;
      if (c._fileCount >= this.options.maxFileCount) {
        this._browseButton.prop("disabled", true);
      }
      $(c.element).trigger("fileAddedToList", file);
      return true;
    },
    removeFileFromList: function (n, l) {
      var c = this;
      var file = this._files[n];
      this._files.splice(n, 1);
      $(l).closest('li').fadeOut(150, function () {
        $(this).remove();
        c._fileList.find("li.ff-uploader-list-item").each(function (i) {
          $(this).attr("data-no", i);
        });
        $(c.element).trigger("fileRemovedFromList", file);
      });
      this._fileCount--;
      if (this.options.maxFileCount > this._fileCount - 1) {
        this._browseButton.prop("disabled", false);
      }
    },
    addFileToListing: function (id, file) {
      var fileItem = $("<li class='ff-uploader-list-item' data-no=" + this._fileCount + " data-id=" + id + "><div class='ff-uploader-file-remove-icon'></div> <span class='ff-uploader-list-item-text ff-uploader-list-item-link'>" + file + "</span></li>");
      this._fileList.append(fileItem);
      this._files[this._fileCount] = file;
      this._fileCount++;
      if (this._fileCount >= this.options.maxFileCount) {
        this._browseButton.prop("disabled", true);
      }
      $(this.element).trigger("fileAddedToListing", fileItem);
    },
    removeFileFromListing: function (n, l) {
      this.removeFileFromList(n, l);
    },
    checkFileSizeExceed: function (file) {
      var fileMaxSizeExceed = false;
      var fileSizeConv = (file.size / fileSizeMultipliers[this.options.fileSizeMetric]);
      if (fileSizeConv > this.options.maxFileSize) {
        fileMaxSizeExceed = true;
        $(this.element).trigger("fileSizeExceeds", [file.name, fileSizeConv, this.options.maxFileSize]);
      }
      return fileMaxSizeExceed;
    },
    checkFileSizeExceedByExtension: function (file) {
      var fileSizeExceedsByExtension = false;
      var fileSizeConv = (file.size / fileSizeMultipliers[this.options.fileSizeMetric]);
      var fileType = file.name.split('.').pop();
      if (fileSizeConv > this.options.extensionMaxFileSize[fileType]) {
        fileSizeExceedsByExtension = true;
        $(this.element).trigger("fileSizeExceedsByExtension", [file.name, fileSizeConv, this.options.extensionMaxFileSize[fileType], fileType]);
      }
      return fileSizeExceedsByExtension;
    },
    checkFileExtension: function (file) {
      debugger;
      var c = this;
      var fileInValidExtension = true;
      var fileType = file.type === "" ? fileType = file.name.split('.').pop() : file.type;
      if (this.options.allowedExtensions !== "") {
        if (fileType2ExtensionMap[fileType] !== undefined) {
          var resArray = fileType2ExtensionMap[fileType].filter(function (value) {
            return c.options.allowedExtensions.indexOf(value) > -1;
          });
          if (resArray.length > 0) {
            fileInValidExtension = false;
          }
        } else {
          $(this.element).trigger("fileTypeUnknown", [file.name, fileType]);
        }
      }
      if (fileInValidExtension) {
        $(this.element).trigger("fileInvalidExtension", [file.name, fileType]);
      }
      return fileInValidExtension;
    },
    checkFileExists: function (file) {
      var fileExists = false;
      var c = this;
      $.each(this._files, function (index, value) {
        if (file.name === value.name || file.name === value) {
          $(c.element).trigger("fileAlreadyExists", file.name);
          fileExists = true;
        }
      });
      return fileExists;
    }
  });

  $.fn.FFUploader = function (options) {
    if (typeof arguments[0] === 'string') {
      var methodName = arguments[0];
      var args = Array.prototype.slice.call(arguments, 1);
      var returnVal;
      this.each(function () {
        if ($.data(this, 'plugin_' + pluginName) && typeof $.data(this, 'plugin_' + pluginName)[methodName] === 'function') {
          returnVal = $.data(this, 'plugin_' + pluginName)[methodName].apply(this, args);
        } else {
          throw new Error('Method ' + methodName + ' does not exist on jQuery.' + pluginName);
        }
      });
      if (returnVal !== undefined) {
        return returnVal;
      } else {
        return this;
      }
    } else if (typeof options === "object" || !options) {
      return this.each(function () {
        if (!$.data(this, 'plugin_' + pluginName)) {
          $.data(this, 'plugin_' + pluginName, new FFUploader(this, options));
        }
      });
    }
  };
}));
