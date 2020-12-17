// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

let $gallery = document.querySelector('.gallery');
let $searchTextBox = document.querySelector('#search');
let $testImage = document.getElementById('testimg');
let containers;

let Config = {
    State: 'Idle',
    nextIndex: 0,
    curSearch: '',
    newSearch: '',
    inSearchFunc: false,
    lightBoxOpen: false,
    keyMap: { }
};

//setTimeout(() => Config.newSearch = 'rifle', 1000);


let observer = new MutationObserver(function(mutations) {
    //  detect any new img eleents that don't have an load

    let $images = Array.from( document.querySelectorAll('img') ).filter(i => !i.hasAttribute('data-onload') );

    for(let $img of $images) {
        console.log('Connecting event listener to img element');
        $img.addEventListener('load', (event) => {
            let target = event.target;
            target.setAttribute('data-originalwidth', target.naturalWidth)
            target.setAttribute('data-originalheight', target.naturalHeight);
        });
        $img.setAttribute('data-onload', 'true');
    }
});

observer.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});


document.querySelector('.btn').addEventListener('click', (event) => console.log(`${event.target.innerText}`));

let lightBox = undefined;

async function copyToClipboard(event) {
    console.info('Copying to clipboard', event);

    let $img = event.target.closest('.ginner-container').querySelector('img');

    // this img is completely loaded but we don't have hte actual qulaifications of this file
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
        event.target.innerText = 'Copied';
        $img.classList.add('copied-image');

        let $checkbox = document.querySelector('.checkbox');
        // $checkbox.hidden = false;

        let rect = $img.getBoundingClientRect();
        $checkbox.style.left = `${Math.round(rect.left + rect.width / 2)}px`;
        $checkbox.style.top = `${Math.round(rect.top + rect.height / 2)}px`;

        //setTimeout(() => $checkbox.hidden = true, 2000)
    }
    catch (e)
    {
        console.error(e);
    }
}

function removeInsideElement($el) {
    while ($el.hasChildNodes()) {
        $el.removeChild($el.lastChild);
    }
}


function initializeLightBox() {
    if(lightBox !== undefined)
    {
        lightBox.destroy();
        lightBox = undefined;
    }

    lightBox = GLightbox({
        touchNavigation: true,
        loop: true,
        autoplayVideos: true,
        touchFollowAxis: true,
        zoomable: false,
        draggable: false,
    });

    lightBox.on('open', (e) => {
        Config.lightBoxOpen = true;
    });

    lightBox.on('close', (e) => {
        Config.lightBoxOpen = false;
    });

    lightBox.on('slide_changed', ({ prev, current }) => {
        document.querySelector('.checkbox').hidden = true;
        console.log("Prev slide", prev);
        console.log("Current slide", current);
        // Prev and current are objects that contain the following data
        const { slideIndex, slideNode, slideConfig, player, trigger } = current;
        // slideIndex - the slide index
        // slideNode - the node you can modify
        // slideConfig - will contain the configuration of the slide like title, description, etc.
        // player - the slide player if it exists otherwise will return false
        // trigger - this will contain the element that triggers this slide, this can be a link, a button, etc in your HTML, it can be null if the elements in the gallery were set dinamically
    });

}

document.addEventListener('DOMContentLoaded', () => {
    console.log('loading');

    //document.querySelector('.copy-to-clipboard').click = copyToClipboard;

    document.getElementById('fetch-images').addEventListener('click', async () => search());
    //document.addEventListener('scroll', search);
    document.addEventListener('keydown', event => {
        //console.info(event);
        // keyCode is deprecated

        if(!(event.key in Config.keyMap)) {
            Config.keyMap[event.key] = true;
            if (event.key === "Escape" && !Config.lightBoxOpen) {
                window.ipcRenderer.send('close');
            }
        }
    });

    document.addEventListener('keyup', (event) => {
        delete Config.keyMap[event.key];
    });


    $searchTextBox.addEventListener('keyup', (event) => {
        if(event.key === 'Enter') {
            //Config.State = 'Search';
            Config.newSearch = $searchTextBox.value.trim();
            console.log(`Searching for ${Config.newSearch}`);
        }
    });
    $searchTextBox.focus();

    setTimeout(LogicLoop, 1000);

});


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
function buildGoogleUrl({cseId, cseKey, searchText, imgType = undefined, transparencyOnly = false, startIndex = 0}) {
    let url = `https://www.googleapis.com/customsearch/v1?q=${searchText}&start=${startIndex}&cx=${cseId}&searchType=image&key=${cseKey}&filter=1&safe=active`;

    if(imgType !== undefined)
        url += `&imgType=${imgType}`;

    if(transparencyOnly)
        url += "&imgColorType=trans";

    return url;
}

/**
 * @param {String} html - representing a single element
 * @return {Element}
 */
function htmlToElement(html) {
    let template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

function createContainer() {
    // let div = new HTMLDivElement();
    // div.classList = 'image_container placeholder';
    //
    // let img = new Image();
    // img.class = 'image';
    // return img;
    // div.appendChild(img);
    let $el = htmlToElement(`
        <div class="image_container placeholder" data-fullimage="" data-filled="false">
            <a href="javascript:void(0);" class="glightbox " data-type="image" data-glightbox="description: .custom-desc1">
                <img alt="" src="" class="image">
            </a>
        </div>`);
    //

    // client side can only save PNG files

    $el.addEventListener('click', async (event) => {
        console.log('click');
        /*
        try {
            //const imgURL = 'http://localhost:12345/transparent_text.png';
            const imgURL = event.target.getAttribute('data-fullimage');

            const data = await fetch(imgURL);
            const blob = await data.blob();

            await navigator.clipboard.write([
                new ClipboardItem({
                    [blob.type]: blob
                })
            ]);
            console.log('Fetched image copied.');
        } catch(err) {
            console.error(err.name, err.message);
        }
        */
    });

    $el.querySelector('img').addEventListener('load', (event) => {
        console.log("Image loaded");
        // TODO this is jenky as hell, we need a better way to find the image_container for this img
        event.target.parentElement.parentElement.classList.remove('placeholder');
        event.target.parentElement.parentElement.classList.add('flexible');
    });

    return $el;
}

function isBelow($el) {
    let win_height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    let top = window.scrollY || window.scrollTop || document.getElementsByTagName("html")[0].scrollTop;
    let bottom = top + win_height;

    let rect = $el.getBoundingClientRect();

    //let on_screen = rect.bottom > top && rect.top < bottom;
    //let below_screen = !on_screen && rect.top > bottom;
    //let off_screen = rect.bottom < 0 || rect.top > win_height;
    //let below_screen = off_screen && rect.top > win_height;
    let below_screen = rect.top > win_height;
    return below_screen;
}

async function search() {

    if(!Misc.IsNullOrWhitespace(Config.newSearch) && Config.newSearch !== Config.curSearch)
    {
        console.log(`Search param has changed from ${Config.curSearch} to ${Config.newSearch}`);
        Config.nextIndex = 0;
        Config.curSearch = Config.newSearch;
        removeInsideElement($gallery);
        window.scrollTo(0, 0);
    }

    if(Misc.IsNullOrWhitespace(Config.curSearch) || Config.nextIndex === undefined) return;


    // let the process begin
    let $container;
    // TODO since are placeholders are invisible anyway, we could just check to see if any image_containers are off-screen
    // TODO if they are not, then run another ajax query and keep adding elements to the DOM
    // check for any image_container that is below
    let containers = Array.from(document.querySelectorAll('.image_container'));
    while (!containers.some(c => isBelow(c))) {
        console.log("No bottom level image containers, creating additional ones");

        $container = createContainer();
        $gallery.appendChild($container);

        containers = Array.from(document.querySelectorAll('.image_container'));
    }

    //  find any
    // let unfilled_elements = Array.from(document.querySelectorAll('div[data-filled="false"]'));

    let modifiedGallery = false;
    let modifiedContainers = [];

    // TODO This should probably be a setTimeout repeated call to prevent UI blocking
    while (Config.nextIndex !== undefined &&
           Array.from(document.querySelectorAll('div[data-filled="false"]')).length > 0) {
        // run a query and prepare to populate these
        console.log(`Unfilled elements found - fetching from API at index ${Config.nextIndex}`);
        try {

            let response = await fetch(buildGoogleUrl(
                {cseId: window.AppConfig.CSE_ID, cseKey: window.AppConfig.CSE_KEY, searchText: Config.curSearch, startIndex: Config.nextIndex}));
            let json = await response.json();

            Config.nextIndex = json?.queries?.nextPage?.[0]?.startIndex;

            console.info(json);

            for (let item of json?.items) {
                // item?.image?.thumbnailLink
                $container = document.querySelector('div[data-filled="false"]');
                if ($container === null) {
                    $container = createContainer();
                    $gallery.appendChild($container);
                }

                let $img = $container.querySelector('img');
                $img.src = item?.image?.thumbnailLink;

                $container.setAttribute('data-filled', 'true');
                $container.setAttribute('data-fullimage', item?.link);
                //$container.querySelector('a').href = item?.link;
                modifiedGallery = true;
                modifiedContainers.push($container);
            }
        } catch (err) {
            console.error(err);
            break;
        }

        // we might not have been able to fill all the elements, in this case we need to rerun again
    }

    if(modifiedGallery)
    {
        modifiedContainers.forEach(container => {
            let href = container.getAttribute('data-fullimage');
            container.querySelector('a').href = href;
        });

        initializeLightBox();
    }

}