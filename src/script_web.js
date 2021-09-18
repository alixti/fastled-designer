const { remote, shell } = require('electron');
const { Menu, MenuItem } = remote;
const Swal = require('sweetalert2');
const path = require('path');
const FileSaver = require('file-saver');
const customTitlebar = require('custom-electron-titlebar');
const fs = require('fs');


const WinAppTitle = 'FastLED Designer';
var animaciones = {};
var config = {
    playfield: "",
    delay: 50,
    version: remote.app.getVersion(),
    chip: 'NEOPIXEL',
    delayanims: 50,
    intro: false,
    pindata: 0,
    pinclk: 0,
    projectname: "New Project",
    leds: {
        cant: 25,
        positions: {
        },
        css: {
            width: 35,
            height: 35,
            fontsize: 10
        }
    }
};
const titlebar = new customTitlebar.Titlebar({
    backgroundColor: customTitlebar.Color.fromHex('#444')
});
var inoTpl = "";

pathINO = path.join(__dirname, 'tplino.ino');
fs.readFile(pathINO, 'utf-8', (err, data) => {
    if (err) {
        Swal.fire("Oh, no!", "Template file couldn't be loaded for Arduino Exporting:" + err.message, 'error');
        return;
    }
    inoTpl = data;
});

titlebar.updateTitle(WinAppTitle);

function updateMenu() {

    const menu = new Menu();
    menu.append(new MenuItem({
        label: 'File',
        submenu: [
            {
                label: 'Open',
                click: function () {
                    $('label[for="workUpload"]').click();
                }
            },
            {
                label: 'Save',
                click: downloadConfig,
                accelerator: 'Ctrl+S'
            },
            {
                label: 'Export to Arduino',
                click: downloadINO
            },
            {
                label: 'Exit',
                click: function () {
                    remote.app.exit();
                }
            }
        ]
    }));

    menu.append(new MenuItem({
        label: 'Options',
        submenu: [
            {
                label: 'Auto-Save and Auto-Load on start',
                type: 'checkbox',
                click: function () {
                    var text = "The configuration will be saved and loaded on app start.";
                    var title = "Enabled";
                    var strChk = localStorage.getItem("loadOnStartLastSave");
                    if (typeof strChk !== "undefined" && strChk != null) {
                        localStorage.removeItem("loadOnStartLastSave");
                        text = "Remember to save your work going to File > Save or pressing CTRL + S.";
                        title = "Disabled.";
                    } else {
                        localStorage.setItem("loadOnStartLastSave", "ok");
                    }
                    Swal.fire({
                        title: title,
                        html: text,
                        icon: 'success',
                        showCancelButton: false
                    }).then(function () {
                        updateMenu();
                    });
                },
                checked: (typeof localStorage.getItem("loadOnStartLastSave") !== "undefined" && localStorage.getItem("loadOnStartLastSave") != null ? true : false)
            },
            {
                label: 'Project Configuration',
                click: function () {
                    Swal.close();
                    $('#modalConfig').modal('show');
                }
            }
        ]
    }));

    menu.append(new MenuItem({
        label: 'Help',
        submenu: [
            {
                label: 'About this software',
                click: function () {
                    Swal.fire({
                        title: 'About this Software',
                        icon: "",
                        html: 'Version: ' + remote.app.getVersion() + '.<br/>Created by <a href="https://github.com/alixti/" class="text-dark aext" target="_blank" onclick="shell.openExternal($(this).attr(\'href\'));return false">Alixti</a><br/><a href="https://github.com/alixti/fastled-designer" class="text-dark aext" target="_blank" onclick="shell.openExternal($(this).attr(\'href\'));return false">Open repository on GitHub</a>.<br/>Using resources: Electron (v' + process.versions['electron'] + '), Chromium (v' + process.versions['chrome'] + '), NodeJS (v' + process.versions['node'] + '), JQuery 3, Bootstrap 4, SweetAlert2, Bootswatch, Bootstrap ColorPicker, File Saver and Pixabay.',
                        showCancelButton: false,
                        showConfirmButton: false
                    });
                }
            },
            {
                label: 'Toggle Developer Console',
                accelerator: 'F12',
                click: function () {
                    remote.getCurrentWindow().toggleDevTools();
                }
            },
            {
                label: 'Reload',
                click: function () {
                    window.location.reload();
                }
            }
        ]
    }));

    titlebar.updateMenu(menu);
}
updateMenu();


var isPlaying = false;
var timeoutPlay;
var lastIDForPlay = 0;
var playLastFrame = 0;
function playCurrentAnim(el) {
    var animID = parseInt($('#animID').html());
    var ledID = parseInt($('#ledID').html());


    if (typeof animaciones[animID] === "undefined") return;
    if (typeof animaciones[animID].frames === "undefined") return;
    if (Object.keys(Object.keys(animaciones[animID].frames)).length == 0) return;

    if (isPlaying == false) {
        playLastFrame = 0;
        lastIDForPlay = parseInt($('#frameID').html());
        $('.disableMe').addClass('IDisableYou');
        isPlaying = true;
        el.attr('class', 'btn btn-danger btn-sm').html('Stop');
        handlePlay();
    } else {
        clearTimeout(timeoutPlay);
        $('.disableMe').removeClass('IDisableYou');
        isPlaying = false;
        el.attr('class', 'btn btn-primary btn-sm').html('Play');
        $('#frameID').html(lastIDForPlay);

        $.each(animaciones[animID].frames[lastIDForPlay].leds, function (index, value) {
            $('.ledid_' + index).css('background-color', value.color).attr('data-colorhex', value.color);
        });
        //$('#colorSelectBox').colorpicker('setValue', $('.ledid_' + ledID).css('background-color'));
        refreshLists();
    }
}

function handlePlay() {
    var animID = parseInt($('#animID').html());

    $.each(animaciones[animID].frames[playLastFrame].leds, function (key, valuee) {
        $('.ledid_' + key + '').css('background-color', valuee.color).attr('data-colorhex', valuee.color);
    });
    playLastFrame++;

    if (playLastFrame > Object.keys(Object.keys(animaciones[animID].frames)).length - 1) {
        playLastFrame = 0;
    }

    clearTimeout(timeoutPlay);
    timeoutPlay = setTimeout(function () {
        handlePlay();
    }, config.delay);
}


function dragElement(elmnt) {

    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    var elmntJQUERY = elmnt;
    var inx = elmntJQUERY.attr('data-ledid');
    var elmnt = elmnt[0];

    elmnt.onmousedown = dragMouseDown;

    function dragMouseDown(e) {

        if (!isPlaying) {
            $('#ledID').html(elmnt.innerHTML);
        }

        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;

        var calcLeft = (elmnt.offsetLeft - pos1);
        var calcTop = (elmnt.offsetTop - pos2);

        if (calcLeft < 0 || calcLeft > $('.previewside').width() - 30 || calcTop < 0 || calcTop > $('.previewside').height() - 30) return;

        config.leds.positions[inx] = { top: calcTop, left: calcLeft };

        elmnt.style.top = calcTop + "px";
        elmnt.style.left = calcLeft + "px";
    }

    function closeDragElement() {
        saveJson();
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

function createLEDS() {
    $('.previewside').html('');

    var positions = { top: 0, left: 0 }

    for (var index = (config.leds.cant - 1); index > -1; index--) {
        if (!(typeof config.leds.positions[index] !== "undefined" && config.leds.positions[index] != null)) {
            config.leds.positions[index] = { top: positions.top + 10, left: positions.left + 10 };
        }
        var animID = parseInt($('#animID').html());
        var frameID = parseInt($('#frameID').html());
        var color = "#000000";

        if (typeof animaciones[animID] !== "undefined") {
            if (typeof animaciones[animID].frames[frameID] !== "undefined") {
                color = animaciones[animID].frames[frameID].leds[index].color;
            }
        }

        $('.previewside').append('<div class="led ledid_' + index + '" style="top: ' + config.leds.positions[index].top + 'px; left: ' + config.leds.positions[index].left + 'px; background-color: ' + color + ';" data-ledid="' + index + '" data-colorhex="' + color + '">' + index + '</div>');
    }
}

function refreshLists() {
    var animID = parseInt($('#animID').html());
    var frameID = parseInt($('#frameID').html());
    var ledID = parseInt($('#ledID').html());

    $('#listFrames').html('');
    $('#listAnims').html('');

    if (Object.keys(Object.keys(animaciones)).length > 0) {
        $.each(animaciones, function (index, value) {
            $('#listAnims').append('<li class="animLi list-group-item d-flex justify-content-between align-items-center" id="animEl_' + index + '"> <span>' + index + '</span> <div><button class="btn btn-primary btn-sm">Edit</button> <button class="btn btn-danger btn-sm">Delete</button></div> </li>');
        });

        $('#listAnims .animLi .btn-primary').click(function () {
            $('#animID').html($(this).parent().parent().find('span').html());
            $('#frameID').html('0');
            animID = parseInt($('#animID').html());

            if (typeof animaciones[animID].frames[frameID] !== "undefined") {
                $.each(animaciones[animID].frames[frameID].leds, function (index, value) {
                    $('.ledid_' + index).css('background-color', value.color).attr('data-colorhex', value.color);
                });
            }

            refreshLists();
        });
        $('#listAnims .animLi .btn-danger').click(function () {
            var id = parseInt($(this).parent().parent().find('span').html());

            Swal.fire({
                title: 'Are you sure?',
                html: "The whole animation will be deleted.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, delete it!'
            }).then((result) => {
                if (result.value) {
                    if (parseInt($('#animID').html()) == id) {
                        $('#animID').html('0');
                        $('#frameID').html('0');
                    }

                    delete animaciones[id];

                    var oldAnims = JSON.parse(JSON.stringify(animaciones));
                    animaciones = JSON.parse(JSON.stringify({}));
                    var int = 0;
                    $.each(oldAnims, function (indexa) {
                        animaciones[int] = oldAnims[indexa];
                        int++;
                    });

                    refreshLists();
                }
            });
        });

        if (typeof animaciones[animID] !== "undefined") {
            if (typeof animaciones[animID].frames !== "undefined") {
                if (Object.keys(Object.keys(animaciones[animID].frames)).length > 0) {
                    $.each(animaciones[animID].frames, function (index, value) {
                        $('#listFrames').append('<li class="framLi list-group-item d-flex justify-content-between align-items-center" id="frameEl_' + index + '"> <span>' + index + '</span> <div><button class="btn btn-primary btn-sm">Edit</button> <button class="btn btn-danger btn-sm">Delete</button></div> </li>');
                    });
                    $('#listFrames .framLi .btn-primary').click(function () {
                        var id = parseInt($(this).parent().parent().find('span').html());
                        $('#frameID').html(id);
                        $.each(animaciones[animID].frames[id].leds, function (index, value) {
                            $('.ledid_' + index).css('background-color', value.color).attr('data-colorhex', value.color);
                        });
                        refreshLists();
                    });
                    $('#listFrames .framLi .btn-danger').click(function () {
                        var id = parseInt($(this).parent().parent().find('span').html());
                        //var r = confirm("Sure?");
                        //if (r) {
                        $('#frameID').html('0');
                        delete animaciones[animID].frames[id];

                        var oldAnims = JSON.parse(JSON.stringify(animaciones[animID].frames));
                        animaciones[animID].frames = JSON.parse(JSON.stringify({}));
                        var int = 0;
                        $.each(oldAnims, function (indexa) {
                            animaciones[animID].frames[int] = oldAnims[indexa];
                            int++;
                        });

                        refreshLists();
                        //}
                    });
                }
            }
        }
    }
    saveJson(); // we save :D
}

function addNewAnim() {
    var calcKey = Object.keys(Object.keys(animaciones)).length > 0 ? Object.keys(Object.keys(animaciones)).length : 0;
    var ledsxd = {};
    var ledID = parseInt($('#ledID').html());

    for (var index = 0; index < config.leds.cant; index++) {
        ledsxd[index] = { color: "#000000" };
    }
    animaciones[calcKey] = { frames: { 0: { leds: ledsxd } } };

    animaciones[calcKey].frames[0] = { leds: ledsxd };

    $.each(animaciones[calcKey].frames[0].leds, function (index, value) {
        $('.ledid_' + index).css('background-color', value.color).attr('data-colorhex', value.color);
    });

    $('#animID').html(calcKey);

    refreshLists();
}

function addNewFrame() {
    var animID = parseInt($('#animID').html());
    var ledID = parseInt($('#ledID').html());

    if (typeof animaciones[animID] === "undefined") {
        Swal.fire('Oops...', 'You must add a new animation or select an existing one.', 'error');
        return;
    }

    var calcKey = Object.keys(Object.keys(animaciones[animID].frames)).length > 0 ? Object.keys(Object.keys(animaciones[animID].frames)).length : 0;
    var ledsxd = {};

    for (var index = 0; index < config.leds.cant; index++) {
        ledsxd[index] = { color: $('.ledid_' + index).attr('data-colorhex') };
    }

    animaciones[animID].frames[calcKey] = { leds: ledsxd };

    $('#frameID').html(calcKey);
    refreshLists();
}


function updateColor(hexColor) {
    var animID = parseInt($('#animID').html());
    var frameID = parseInt($('#frameID').html());
    var ledID = parseInt($('#ledID').html());
    $('.ledid_' + ledID).css('background-color', hexColor).attr('data-colorhex', hexColor);
    if (typeof animaciones[animID] !== "undefined") {
        if (typeof animaciones[animID].frames[frameID] !== "undefined") {
            $.each(animaciones[animID].frames[frameID].leds, function (index, value) {
                animaciones[animID].frames[frameID].leds[index].color = $('.ledid_' + index).attr('data-colorhex');
            });
        }
    }

    saveJson();
}

function updateCSSJS() {
    $('#cssJS').html('.led { width: ' + config.leds.css.width + 'px; height: ' + config.leds.css.height + 'px; font-size: ' + config.leds.css.fontsize + 'px; }');
    saveJson();
}

function delConfigAnims(delAnimaciones, delConfiguracion) {
    Swal.fire({
        title: 'Are you sure?',
        html: "The whole information will be deleted.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes!'
    }).then((result) => {
        if (result.value) {
            if (delAnimaciones) localStorage.removeItem("animaciones");
            if (delConfiguracion) localStorage.removeItem("config");
            Swal.fire('Alright!', 'The information has been deleted.', 'success');
            setTimeout(function () {
                location.reload();
            }, 1000);
        }
    });
}

function saveJson() {
    var strChk = localStorage.getItem("loadOnStartLastSave");
    var jsonData = {
        animaciones: JSON.stringify(animaciones),
        config: JSON.stringify(config)
    };
    //if (typeof (Storage) !== "undefined") {
    localStorage.setItem("animaciones", jsonData.animaciones);
    localStorage.setItem("config", jsonData.config);
    //}
}

function updateOnPreviewBgUpload() {
    if (this.files && this.files[0]) {

        if (this.files[0].type != "image/jpeg" && this.files[0].type != "image/png" && this.files[0].type != "image/jpg" && this.files[0].type != "image/gif") {
            Swal.fire('ERROR', 'INVALID FILE.', 'error');
            return;
        }

        var reader = new FileReader();
        reader.onload = function (e) {
            $('.previewside').css('background-image', 'url(' + e.target.result + ')');
            config.playfield = e.target.result;
            saveJson();
        }
        reader.readAsDataURL(this.files[0]); // convert to base64 string
    }
}

function updateConfigByUpload() {
    if (this.files && this.files[0]) {
        if (this.files[0].type != "application/json") {
            Swal.fire('ERROR', 'INVALID FILE.', 'error');
            return;
        }

        var reader = new FileReader();
        reader.onload = function (e) {
            var resJson = JSON.parse(e.target.result);
            animaciones = JSON.parse(JSON.stringify(resJson.animaciones));
            config = JSON.parse(JSON.stringify(resJson.config));
            console.log(config);
            Swal.close(); //fix
            startUp();
            saveJson();
        }
        reader.readAsText(this.files[0]); // convert to base64 string
    }
}

function downloadConfig() {
    var jsonData = {
        animaciones: animaciones,
        config: config
    };
    var file = new File([JSON.stringify(jsonData)], config.projectname + ".json", { type: "application/json;charset=utf-8" });
    FileSaver.saveAs(file);
}

String.prototype.convertToRGB = function () {
    if (this.length != 6) {
        throw "Only six-digit hex colors are allowed. (Content: " + this + "";
    }

    var aRgbHex = this.match(/.{1,2}/g);
    var aRgb = [
        parseInt(aRgbHex[0], 16),
        parseInt(aRgbHex[1], 16),
        parseInt(aRgbHex[2], 16)
    ];
    return aRgb;
}

function downloadINO() {
    var text = inoTpl;
    var animsField = "";
    var loopField = "";
    $.each(animaciones, function (index, value) {
        animsField += "void anim_" + index + "() {\n";
        $.each(animaciones[index].frames, function (indexe, valueuy) {
            animsField += "  //Frame " + indexe + "\n";
            $.each(valueuy.leds, function (indexa, valuee) {
                var color = valuee.color.substring(1).convertToRGB();
                animsField += '  leds[' + indexa + '] = CRGB(' + color[0] + ',' + color[1] + ',' + color[2] + ");\n";
            });
            animsField += "  FastLED.show();" + (config.delay > 0 ? "\n  delay(" + config.delay + ");\n" : "\n");
        });
        animsField += "}\n\n";
    });
    $.each(animaciones, function (index, value) {
        loopField += "  anim_" + index + "();\n" + (config.delayanims > 0 ? "  delay(" + config.delayanims + ");\n" : '');
    });
    text = text.replace('__LOOPFIELD__', loopField);
    text = text.replace('__ANIMSFIELD__', animsField);
    text = text.replace('__DM_NUMLEDS__', config.leds.cant);
    text = text.replace('__DM_PINDATA__', config.pindata);
    text = text.replace('__DM_PINCLK__', config.pinclk);
    text = text.replace('//FastLED.addLeds<' + config.chip, 'FastLED.addLeds<' + config.chip);
    text = text.replace(/\/\/FastLED\.addLeds<(.*)>\((.*)\);\n/gm, "");
    var file = new File([text], config.projectname + ".ino", { type: "text/x-arduino;charset=utf-8" });
    FileSaver.saveAs(file);
}

function loadPreviusStorageConfig() {
    var strChk = localStorage.getItem("loadOnStartLastSave");
    if (typeof strChk !== "undefined" && strChk != null) {
        strChk = localStorage.getItem("animaciones");
        if (typeof strChk !== "undefined" && strChk != null) {
            animaciones = JSON.parse(JSON.stringify(JSON.parse(strChk)));
        }
        strChk = localStorage.getItem("config");
        if (typeof strChk !== "undefined" && strChk != null) {
            config = JSON.parse(JSON.stringify(JSON.parse(strChk)));
        }
    }
}

function intro() {
    titlebar.updateTitle('Introduction - ' + WinAppTitle);
    Swal.mixin({
        confirmButtonText: 'Next &rarr;',
        cancelButtonText: 'Cancel',
        showCancelButton: true,
        progressSteps: ['1', '2']
    }).queue([
        {
            title: 'Project\'s Name',
            input: 'text',
            inputValue: config.projectname
        },
        {
            title: 'LEDS Quantity',
            input: 'range',
            inputAttributes: {
                min: 1,
                max: 500,
                step: 1
            },
            footer: 'The LEDS Quantity won\'t be able to be changed in the future.',
            inputValue: config.leds.cant
        }
    ]).then((result) => {
        if (result.value) {
            const answers = result.value

            config.projectname = answers[0];
            config.leds.cant = parseInt(answers[1]);
            config.intro = true;

            Swal.fire({
                title: 'Done!',
                html: "You can start working now!",
                confirmButtonText: 'Additional Configuration',
                showCancelButton: true,
                cancelButtonText: 'Start Working',
            }).then((result) => {
                if (result.value) {
                    $('#modalConfig').modal('show');
                }
            });
        }
        startUp(true);
    });
}

function allBlackOkay() {
    for (var index = 0; index < config.leds.cant; index++) {
        var animID = parseInt($('#animID').html());
        var frameID = parseInt($('#frameID').html());
        var color = "#000000";

        if (typeof animaciones[animID] !== "undefined") {
            if (typeof animaciones[animID].frames[frameID] !== "undefined") {
                animaciones[animID].frames[frameID].leds[index].color = color;
            }
        }

        $('.ledid_' + index).css('background-color', color).attr('data-colorhex', color);
    }
}


function startUp(isFirst) {
    titlebar.updateTitle(config.projectname + ' - ' + WinAppTitle);
    updateCSSJS();
    createLEDS();
    $('.led').each(function () {
        dragElement($(this));
    });
    $('#ledID').html('0');
    $('#animID').html('0');
    $('#frameID').html('0');
    $('.previewside').css('background-image', 'url(' + config.playfield + ')');
    if (!isFirst) {
        $('#colorSelectBox').colorpicker('setValue', '#000000');
    }
    $('#config_0').val(config.delay).on('change keyup focus', function () {
        config.delay = parseInt($(this).val());
    });
    $('#config_1').val(config.leds.css.width).on('change keyup focus', function () {
        config.leds.css.width = parseInt($(this).val());
    });
    $('#config_2').val(config.leds.css.height).on('change keyup focus', function () {
        config.leds.css.height = parseInt($(this).val());
    });
    $('#config_3').val(config.leds.css.fontsize).on('change keyup focus', function () {
        config.leds.css.fontsize = parseInt($(this).val());
    });

    $('#config_4').val(config.leds.cant).on('change keyup focus', function () {
        config.leds.cant = parseInt($(this).val());
    });

    $('#config_5').val(config.pindata).on('change keyup focus', function () {
        config.pindata = parseInt($(this).val());
    });
    $('#config_6').val(config.pinclk).on('change keyup focus', function () {
        config.pinclk = parseInt($(this).val());
    });
    $('#config_7').val(config.delayanims).on('change keyup focus', function () {
        config.delayanims = parseInt($(this).val());
    });
    $('#config_8').val(config.chip).on('change keyup focus', function () {
        config.chip = $(this).val();
    });
    $('#config_9').val(config.projectname).on('change keyup focus', function (e) {
        config.projectname = $(this).val();
        titlebar.updateTitle(config.projectname + ' - ' + WinAppTitle);
    });
    $('#configField').find('input, select').on('change keyup focus', updateCSSJS);
    refreshLists();
}

$(function () {
    $.ajax({
        url: 'https://raw.githubusercontent.com/alixti/fastled-designer/main/feed/' + remote.app.getVersion() + '.json',
        method: 'GET',
        dataType: 'json',
        success: function (h) {
            if (h.showSwal == true) {
                Swal.fire(h.swalConfig);
            }
        },
        error: function () {
            console.log('ERROR GETTING INFORMATION FOR UPDATES');
        }
    });
    $('#colorSelectBox').attr('data-color', "#000000")
    $('#colorSelectBox').colorpicker({ inline: true, container: true, customClass: 'colorpicker-2x', format: 'hex', useAlpha: false, useHashPrefix: true, sliders: { saturation: { maxLeft: 200, maxTop: 200 }, hue: { maxTop: 200 } } }).on('colorpickerChange colorpickerCreate', function (event) {
        $('#inputColor').css('background-color', event.color.toHexString()).val('HEX: ' + event.color.toHexString() + ' / RGB: ' + event.color.toRgbString());
        updateColor(event.color.toHexString());
    });
    $('#PreviewBgUpload').change(updateOnPreviewBgUpload);
    $('#workUpload').change(updateConfigByUpload);
    $('#allblackbtn').click(allBlackOkay);
    $('#getColorOfActualLed').click(function () {
        $('#colorSelectBox').colorpicker('setValue', $('.ledid_' + $('#ledID').html()).attr('data-colorhex'));
    });
    $('#delConfigAnims').click(function () {
        delConfigAnims(true, true);
    });
    $('#delConfig').click(function () {
        delConfigAnims(false, true);
    });
    $('#delAnims').click(function () {
        delConfigAnims(true, false);
    });
    loadPreviusStorageConfig();
    if (config.intro == false) {
        intro();
    } else {
        startUp(true);
    }
    $('.aext').on('click', function (e) {
        e.preventDefault();
        shell.openExternal($(this).attr('href'));
        return false;
    });
});