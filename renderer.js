// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

let $gallery = document.querySelector('.gallery');
let $searchTextBox = document.querySelector('#search');
let $modal = document.querySelector('#settings');
let modalSettings = new bootstrap.Modal($modal, { focus: true });

let lightBoxList = [];

let Config = {
    State: '',
    nextIndex: 0,
    curSearch: '',
    newSearch: '',
    inSearchFunc: false,
    lightBoxOpen: false,
    keyMap: { },
    appSettings: { }
};

//setTimeout(() => Config.newSearch = 'brannigans big book of war', 1000);
document.addEventListener('DOMContentLoaded', async () => {
    await runSetup();

    const searchString = new URL(window.location.href).searchParams.get('searchString');
    if (!Misc.IsNullOrWhitespace(searchString) ) {
        console.log(`Found search string: ${searchString}`);
        $searchTextBox.value = searchString;
        Config.newSearch = $searchTextBox.value.trim();
        $searchTextBox.focus();
    }
});

function setupObserver() {
    let observer = new MutationObserver(function(mutations) {
        //  detect any new img elements that don't have load attribute

        let $images = Array.from( document.querySelectorAll('img') ).filter(i => !i.hasAttribute('data-onload') );

        for(let $img of $images) {
            console.log('Connecting event listener to img element');
            $img.addEventListener('load', (event) => {
                let target = event.target;
                target.setAttribute('data-originalwidth', target.naturalWidth);
                target.setAttribute('data-originalheight', target.naturalHeight);
            });
            $img.setAttribute('data-onload', 'true');
        }
    });

    observer.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});
}

async function setupSettings() {
    let settings = await window.ipcRenderer.invoke('load-settings');
    Config.State = 'Ready';
    Config.appSettings = settings;
    document.querySelector('body').style.backgroundColor = Config.appSettings.COLOR_SETTINGS;
}

function setupHandlers() {
    document.querySelector('#load-settings').addEventListener('click', (event) => {
        document.querySelector('#cse_clientid').value = Config.appSettings.CSE_ID;
        document.querySelector('#cse_key').value = Config.appSettings.CSE_KEY;
        document.querySelector('#settings_color').value = Config.appSettings.COLOR_SETTINGS;
        document.querySelector('#banned_domains').value = Config.appSettings.BANNED_DOMAINS.join('\n');
        document.querySelector('#no_ai').checked = Config.appSettings.NO_AI;
        modalSettings.show();
    });

    document.querySelector('#save-settings').addEventListener('click', (event) => {
        Config.appSettings.CSE_ID = document.querySelector('#cse_clientid').value;
        Config.appSettings.CSE_KEY = document.querySelector('#cse_key').value;
        Config.appSettings.COLOR_SETTINGS = document.querySelector('#settings_color').value;
        Config.appSettings.BANNED_DOMAINS = document.querySelector('#banned_domains')?.value.split('\n')?.map(v => v.trim()) ?? [];
        Config.appSettings.NO_AI = document.querySelector('#no_ai').checked;
        document.querySelector('body').style.backgroundColor = Config.appSettings.COLOR_SETTINGS;
        window.ipcRenderer.send('save-settings', Config.appSettings);
        modalSettings.hide();
    });

    document.getElementById('fetch-images').addEventListener('click', async () => search());
    document.addEventListener('keydown', event => {
        if(!(event.key in Config.keyMap)) {
            Config.keyMap[event.key] = true;
            if (event.key === 'Escape') {
                if(!Config.lightBoxOpen)
                    window.ipcRenderer.send('close');
                else {
                    Config.lightBoxOpen = false;
                }
            }
        }
    });

    document.addEventListener('keyup', (event) => {
        delete Config.keyMap[event.key];
    });


    let fnInputChanged = Misc.debounce(() => {
        Config.newSearch = $searchTextBox.value.trim();
    }, 1500);

    $searchTextBox.addEventListener('input', fnInputChanged);
    $searchTextBox.addEventListener('keyup', (event) => {
        if(event.key === 'Enter') {
            //Config.State = 'Search';
            Config.newSearch = $searchTextBox.value.trim();
            console.log(`Searching for ${Config.newSearch}`);
        }
    });

    document.addEventListener('resize', () => {

    });

    $searchTextBox.focus();

    setTimeout(LogicLoop, 1000);
}


async function runSetup() {
    await setupSettings();
    setupObserver();
    setupHandlers();
}



let lightBox = undefined;

async function copyToClipboard(event) {
    console.info('Copying to clipboard', event);

    let $img;
    if(event instanceof HTMLImageElement)
        $img = event;
    else
        $img = event.target.closest('.ginner-container').querySelector('img');

    // this img is completely loaded, but we don't have the actual qualifications of this file
    let canvas = document.createElement('canvas');
    canvas.height = parseInt( $img.getAttribute('data-originalheight') );
    canvas.width = parseInt( $img.getAttribute('data-originalwidth') );
    let context = canvas.getContext('2d');

    context.drawImage($img, 0, 0);

    try {
        let blob = await new Promise(resolve => canvas.toBlob(resolve));
        await navigator.clipboard.write([
            new ClipboardItem({
                'image/png': blob
            })
        ]);

        if(!(event instanceof HTMLImageElement))
            event.target.textContent = 'Copied';

        $img.classList.add('copied-image');

        let $checkbox = document.querySelector('.checkbox');
        // $checkbox.hidden = false;

        let rect = $img.getBoundingClientRect();
        $checkbox.style.left = `${Math.round(rect.left + rect.width / 2)}px`;
        $checkbox.style.top = `${Math.round(rect.top + rect.height / 2)}px`;
    }
    catch (e)
    {
        console.error(e);
    }
}


function initializeLightBox() {

    // if(lightBox !== undefined)
    // {
    //     lightBox.destroy();
    //     lightBox = undefined;
    // }

    lightBox = GLightbox({
        selector: `.glightbox-${lightBoxList.length}`,
        touchNavigation: true,
        loop: true,
        autoplayVideos: true,
        touchFollowAxis: true,
        zoomable: false,
        draggable: false,
        skin: 'paddedbox' // creates a class called glightbox-paddedbox
    });

    // slide_after_load
    lightBox.on('slide_changed', e => {
        console.info('slide changed', e);
        // current.slideNode.querySelector('img') instanceof HTMLImageElement

        // current.slideNode.nextSibling = div.gslide.loaded.current

        // workaround because glightbox e.current is usually one image behind
        let node = undefined;
        if(e?.current?.slideNode?.previousSibling?.classList?.contains('current'))
            node = e.current.slideNode.previousSibling;
        else if(e?.current?.slideNode?.nextSibling?.classList?.contains('current'))
            node = e.current.slideNode.nextSibling;
        else
            node = e.current.slideNode;

        copyToClipboard(node.querySelector('img'));

        //console.info(current.slideNode.querySelector('img'));
        //copyToClipboard(current.slideNode.querySelector('img'));
    });

    // this method is useless because it runs multiple times (possibly because of preloading??)
    lightBox.on('slide_after_load', e => {
        // console.info('slide_after_load', e);
        // console.info(e.slideNode.querySelector('img'));
        // current.slideNode.querySelector('img') instanceof HTMLImageElement
        //copyToClipboard(current.slideNode.querySelector('img'));
    });

    lightBox.on('open', (e) => {
        Config.lightBoxOpen = true;
        // _imgNode.setAttribute('style', "max-height: calc(100vh - ".concat(descHeight, "px)"));
    });

    lightBox.on('close', (e) => {
        console.log('glightbox closed');
        Config.lightBoxOpen = false;
    });

    lightBoxList.push(lightBox);
}




async function LogicLoop() {
    //console.log("Logic Loop");

    if(!Config.inSearchFunc) {
        Config.inSearchFunc = true;
        let result = await search();
        Config.inSearchFunc = false;
    }

    setTimeout(LogicLoop, 500);
}

// imgType = clipart, face, lineart, stock, photo, animated
function buildGoogleUrl({cseId, cseKey, searchText, imgType = undefined, transparencyOnly = false, startIndex = 0, noAI = false}) {
    if(noAI) {
        searchText = `${searchText} before:2022`;
    }

    let url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(searchText)}&start=${startIndex}&cx=${cseId}&searchType=image&key=${cseKey}&filter=1&safe=active`;

    if(imgType !== undefined)
        url += `&imgType=${imgType}`;

    if(transparencyOnly)
        url += '&imgColorType=trans';

    return url;
}


function createContainer() {

    let $el = Misc.htmlToElement(`
        <div class="image_container placeholder" data-fullimage="" data-filled="false">
            <a href="javascript:void(0);" class="glightbox-${lightBoxList.length}" data-type="image" data-glightbox="description: .custom-desc1">
                <img alt="" src="" class="image">
            </a>
        </div>`);


    $el.querySelector('img').addEventListener('load', (event) => {
        console.log('Thumbnail loaded');
        Misc.toggleClass(event.target.closest('div.placeholder'), 'flexible', ['flexible', 'placeholder']);
    });

    return $el;
}



async function search() {

    if(!Misc.IsNullOrWhitespace(Config.newSearch) && Config.newSearch !== Config.curSearch)
    {
        console.log(`Search param has changed from ${Config.curSearch} to ${Config.newSearch}`);
        Config.nextIndex = 0;
        Config.curSearch = Config.newSearch;
        Misc.removeInsideElement($gallery);
        window.scrollTo(0, 0);

        // destroy all light boxes
        for(let l of lightBoxList)
            l.destroy();

        lightBoxList = [];
    }

    if(Misc.IsNullOrWhitespace(Config.curSearch) || Config.nextIndex === undefined) return;


    // let the process begin
    let $container;
    let containers = Array.from(document.querySelectorAll('.image_container'));
    while (!containers.some(c => Misc.isBelow(c))) {
        console.log('No bottom level image containers, creating additional ones');

        $container = createContainer();
        $gallery.appendChild($container);

        containers = Array.from(document.querySelectorAll('.image_container'));
    }

    let modifiedGallery = false;
    let modifiedContainers = [];

    while (Config.nextIndex !== undefined &&
           Array.from(document.querySelectorAll('div[data-filled="false"]')).length > 0) {
        // run a query and prepare to populate these
        console.log(`Unfilled elements found - fetching from API at index ${Config.nextIndex}`);
        try {

            let response = await fetch(buildGoogleUrl(
                {
                    cseId: Config.appSettings.CSE_ID,
                    cseKey: Config.appSettings.CSE_KEY,
                    searchText: Config.curSearch,
                    startIndex: Config.nextIndex,
                    noAI: Config.appSettings.NO_AI
                }));
            let json = await response.json();

            Config.nextIndex = json?.queries?.nextPage?.[0]?.startIndex;

            console.info(json);

            if(Array.isArray(json?.items)) {

                const isBanned = hostname => Config.appSettings.BANNED_DOMAINS.map(d => new RegExp(d, 'gi')).some(re => re.test(hostname));

                const searchResults = json.items.map(itm => new GoogleClasses.GoogleItemResult(itm))
                    .filter(item => !isBanned(new URL(item.link).hostname) );

                // filter out results by Config.appSettings.BANNED_DOMAINS


                for (const item of searchResults) {
                    // item?.image?.thumbnailLink
                    $container = document.querySelector('div[data-filled="false"]');
                    if ($container === null) {
                        $container = createContainer();
                        $gallery.appendChild($container);
                    }

                    let $img = $container.querySelector('img');
                    $img.src = item.image.thumbnailLink;

                    $container.setAttribute('data-filled', 'true');
                    $container.setAttribute('data-fullimage', item.link);
                    modifiedGallery = true;
                    modifiedContainers.push($container);
                }
            }
        } catch (err) {
            console.error(err);
            break;
        }

        // we might not have been able to fill all the elements, in this case we need to rerun again
    }

    // don't insert the <a> elements until we call lightbox otherwise the <a> tags will redirect to the files
    if(modifiedGallery)
    {
        modifiedContainers.forEach(container => {
            let href = container.getAttribute('data-fullimage');
            container.querySelector('a').href = href;
        });

        initializeLightBox();
    }

}
