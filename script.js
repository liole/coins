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
    localStorage.version = dataVersion;
    updateStorage();
}

function stripName(name) {
    return name.replace("^", "").replace("~", "");
}

function updateTitle() {
    if (collection) {
        $('#title').text('Coins - ' + stripName(region.name) + ': ' + collection.name);
    } else if (region) {
        $('#title').text('Coins - ' + stripName(region.name));
    } else {
        $('#title').text('Coins');
    }
    document.title = $('#title').text();
}

function parseHash() {
    var url = location.hash.substring(1);
    if (url == "") {
        backFlag();
    } else if (url == "!") {
        showSync();
    } else {
        var parts = url.split("/");
        var regName = parts[0].replace("~", "").replace("^", "");
        var region = data.find(r => r.name == regName);
        if (parts[0].endsWith("~")) {
            region = reverseObject(region);
        }
        if (parts[0].startsWith("^")) {
            region = sortObject(region);
        }
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
    caches.keys().then(names => {
        $('#dataVer').text('v' + localStorage.version);
        var appV = '0.0';
        if (names.length > 0) {
            var name = names.sort().reverse()[0];
            var appV = name.substring(name.search('-v')+2);
            $('#appVer').text('v' + appV);
        }
        $('#refresh').css({opacity: 
            (!window.dataVersion || 
            localStorage.version == window.dataVersion ||
            !window.requiredAppVersion ||
            window.requiredAppVersion > appV) ? 0 : 1});
    });
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
                $("<span>", {
                    "class": "collectionStat",
                    text: getCollStat(coll)
                }),
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
    updateCollsStat();
    if (region.collections.length == 1 && skip) {
        selectCollection(region.collections[0]);
    } else {
        switchTo("Collections");
    }
}

function selectCollectionGo(coll) {
    //var index = coll.index;
    if (index == undefined) {
        var index = region.collections.findIndex(c => c.name == coll.name);
    }
    location.hash = "#" + region.name + "/" + index;
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

function getCollStatObj(coll) {
    var all = coll.coins.length;
    var present = coll.coins.filter(c => c.present).length;
    return {present, all};
}
function getCollStat(coll) {
    var {present, all} = getCollStatObj(coll);
    return present + ' / ' + all;
}

function updateStat() { 
    //var all = collection.coins.length;
    //var present = collection.coins.filter(c => c.present).length;
    //$('#coinStat').text(present + ' / ' + all);
    $('#coinStat').text(getCollStat(collection));
}

function updateCollsStat() { 
    var all = region.collections
            .reduce((sum, coll) => 
            sum + coll.coins.length, 0);
    var present = region.collections
        .reduce((sum, coll) => 
            sum + coll.coins.filter(c => c.present).length, 0);
    $('#collsStat').text(present + ' / ' + all);
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

function revGo() {
    if (region.name.endsWith("~")) {
        location.hash = "#" + region.name.replace("~", "")
    } else {
        location.hash = "#" + region.name + "~";
    }
}

function sortCollsGo() {
    if (region.name.startsWith("^")) {
        location.hash = "#" + region.name.replace("^", "")
    } else {
        location.hash = "#" + "^" + region.name;
    }
}

function sortColls(region = window.region) {
    if (region.sorted) {
        parseHash();
    } else {
        selectRegion(sortObject(region));
    }
}

function reverseObject(region) {
    var colls = {};
    for (let coll of region.collections) {
        for (let coin of coll.coins) {
            if (colls[coin.name] == undefined) {
                colls[coin.name] = {
                    name: coin.name,
                    image: coin.image,
                    coins: []
                }
            }
            colls[coin.name].coins.push({
                name: coll.name,
                image: coin.image,
                get present() { return coin.present; },
                set present(val) { coin.present = val; }
            });
        }
    }
    return {
        name: region.name + "~",
        flag: region.flag,
        collections: Object.keys(colls)
            .map(name => colls[name])  
    };
}

function sortObject(region) {
    var colls = region.collections.map((coll, i) => ({
        name: coll.name,
        image: coll.image,
        coins: coll.coins,
        index: i,
        stat: getCollStatObj(coll)
    }));
    var val = coll => -coll.stat.present/coll.stat.all;
    colls = colls.sort((a, b) => val(a)-val(b));
    return {
        name: "^" + region.name,
        flag: region.flag,
        sorted: true,
        collections: colls
    };
}

function merge(target, ext) {
    var index = -1;
    for (var region of ext) {
        var match = target.find(r => r.name == region.name);
        if (match) {
            index = target.findIndex(r => r.name == region.name);
            mergeRegion(match, region);
        } else {
            target.splice(index+1, 0, region);
            index++;
        }
    }
    return target;
}
function mergeRegion(target, ext) {
    if (ext.flag) {
        target.flag = ext.flag;
    }
    var index = -1;
    for (var coll of ext.collections) {
        var match = target.collections.find(c => c.name == coll.name);
        if (match) {
            index = target.collections.findIndex(c => c.name == coll.name);
            mergeCollection(match, coll);
        } else {
            target.collection.splice(index+1, 0, coll);
            index++;
        }
    }
    return target;
}
function mergeCollection(target, ext) {
    if (ext.image) {
        target.image = ext.image;
    }
    var index = -1;
    for (var coin of ext.coins) {
        var match = target.coins.find(c => c.name == coin.name);
        var fullMatch = target.coins.find(c => c.name == coin.name && c.image == coin.image);
        var countOld = target.coins.filter(c => c.name == coin.name).length;
        var countNew = ext.coins.filter(c => c.name == coin.name).length;
        if (match && (fullMatch || countOld == countNew)) {
            if (fullMatch) {
                match = fullMatch;
            }
            index = target.coins.findIndex(c => c.name == coin.name);
            if (coin.image) {
                match.image = coin.image;
            }
            if (coin.present !== undefined) {
                match.present = coin.present;
            }
        } else {
            target.coins.splice(index+1, 0, coin);
            index++;
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
    document.title = $('#title').text();
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