if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(function(registration) {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, function(err) {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

function switchTo(id) {
    $(".box").each((i, box) => {
        if (box.id == id) {
            $(box).show();
        } else {
            $(box).hide();
        }
    });
}

function updateStorage() {
    localStorage.data = JSON.stringify(data);
}

function initStorage() {
    localStorage.clear();
    if (window.data == undefined) {
        window.data = [];
    }
    merge(data, initData);
    localStorage.version = version;
    updateStorage();
}

function updateTitle() {
    if (collection) {
        $('#title').text('Coins - ' + region.name + ': ' + collection.name);
    } else if (region) {
        $('#title').text('Coins - ' + region.name);
    } else {
        $('#title').text('Coins');
    }
}

function parseHash() {
    var url = location.hash.substring(1);
    if (url == "") {
        backFlag();
    } else if (url == "!") {
        showSync();
    } else {
        var parts = url.split("/");
        var region = data.find(r => r.name == parts[0]);
        selectRegion(region);
        if (parts.length > 1) {
            var index = parseInt(parts[1]);
            selectCollection(region.collections[index]);
        }
    }
}

window.onpopstate = function (e) {
    parseHash();
}

function init() {
    if (localStorage.data == undefined) {
        initStorage();
    } else {
        window.data = JSON.parse(localStorage.data);
    }
    $('#refresh').css({opacity: 
        (!window.version || localStorage.version == window.version) ? 0 : 1});
    $('#regList').empty();
    for (let region of data) {
        $('#regList').append(
            $('<div>', {
                "class" : 'region',
                click: () => selectRegionGo(region, true)
            }).append(
                $('<img>', {
                    "class": 'flag',
                    src: region.flag
                }), 
                $("<span>", {
                    "class": "regionName",
                    text: region.name
                })
            )
        );
    }
    window.region = null;
    window.collection = null;
    switchTo("Regions");
    parseHash();
}

function selectRegionGo(region, skip = false) {
    if (region.collections.length == 1 && skip) {
        window.region = region;
        selectCollectionGo(region.collections[0]);
    } else {
        location.hash = "#" + region.name;
    }
}

function selectRegion(region, skip = false) {
    window.region = region;
    window.collection = null;
    $('.onlyHome').hide();
    $('#flag').show();
    updateTitle();
    $('#colList').empty();
    for (let coll of region.collections) {
       $('#colList').append(
            $('<div>', {
                "class" : 'collection',
                click: () => selectCollectionGo(coll)
            }).append(
                $('<img>', {
                    "class": 'collectionImage',
                    src: coll.image
                }), 
                $("<span>", {
                    "class": "collectionName",
                    text: coll.name
                })
            )
        ); 
    }
    if (region.collections.length == 1 && skip) {
        selectCollection(region.collections[0]);
    } else {
        switchTo("Collections");
    }
}

function selectCollectionGo(coll) {
    location.hash = "#" + region.name + "/" +
        region.collections.findIndex(c => c.name == coll.name);
}

function selectCollection(coll) {
    window.collection = coll;
    $('#folder').show();
    updateTitle();
    $('#coinList').empty();
    for (let coin of coll.coins) {
       $('#coinList').append(
            $('<div>', {
                "class" : 'coin' +
                    (coin.present?' present':''),
                click: function () {
                    selectCoin(coin, this);
                }
            }).append(
                $('<img>', {
                    "class": 'coinImage',
                    src: coin.image
                }), 
                $("<span>", {
                    "class": "coinName",
                    text: coin.name
                })
            )
        ); 
    }
    updateStat();
    switchTo("Coins");
}

function updateStat() { 
    var all = collection.coins.length;
    var present = collection.coins.filter(c => c.present).length;
    $('#coinStat').text(present + ' / ' + all);
}

function selectCoin(coin, self) {
    coin.present = !coin.present;
    $(self).toggleClass('present');
    updateStat();
    updateStorage();
}

function backFlagGo() {
    location.hash = "";
}

function backFlag() {
    $('.onlyHome').show();
    $('#folder').hide();
    $('#flag').hide();
    collection = null;
    region = null;
    updateTitle();
    switchTo("Regions");
}

function backColGo() {
    $('#folder').hide();
    collection = null;
    selectRegionGo(region);
}
function refresh() {
    localStorage.clear();
    init();
}

function merge(target, ext) {
    for (var region of ext) {
        var match = target.find(r => r.name == region.name);
        if (match) {
            mergeRegion(match, region);
        } else {
            target.push(region);
        }
    }
    return target;
}
function mergeRegion(target, ext) {
    if (ext.flag) {
        target.flag = ext.flag;
    }
    for (var coll of ext.collections) {
        var match = target.collections.find(c => c.name == coll.name);
        if (match) {
            mergeCollection(match, coll);
        } else {
            target.collection.push(coll);
        }
    }
    return target;
}
function mergeCollection(target, ext) {
    if (ext.image) {
        target.image = ext.image;
    }
    for (var coin of ext.coins) {
        var match = target.coins.find(c => c.name == coin.name);
        if (match) {
            if (coin.image) {
                match.image = coin.image;
            }
            if (coin.present !== undefined) {
                match.present = coin.present;
            }
        } else {
            target.coins.push(coin);
        }
    }
    return target;
}

function noImagesData() {
    var res = JSON.parse(localStorage.data);
    for (var region of res) {
        delete region.flag;
        for (var coll of region.collections) {
            delete coll.image;
            for (var coin of coll.coins) {
                delete coin.image;
            }
        }
    }
    return res;
}

function showSyncGo() {
    location.hash = "#!";
}

function showSync() {
    region = null;
    collection = null;
    $('#title').text('Sync');
    $('.onlyHome').hide();
    $('#flag').show();
    $('#syncKey').val('');
    $('#uploadBtn').css({opacity: 1, transform: "scale(1)"});
    $('#cloudKey').text('000').css({opacity: 0, transform: "scale(.1)"});
    switchTo('Sync');
}

function upload() {
    $('#uploadBtn').css({opacity: 0, transform: "scale(.1)"});
    $.post('sync/', {data: JSON.stringify(noImagesData())}, key => {
        $('#cloudKey').text(key).css({opacity: 1, transform: "scale(1)"});
    });
}
function keyChange() {
    var key = $('#syncKey').val();
    if (key.length == 4) {
        $.get('sync/', {key}, (resp) => {
            merge(data, JSON.parse(resp));
            updateStorage();
            $('#uploadBtn').css({opacity: 0, transform: "scale(.1)"});
            $('#cloudKey').text('done').css({opacity: 1, transform: "scale(1)"});
        });
    }
}