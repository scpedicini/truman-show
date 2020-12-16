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
};


let lightBox = undefined;

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
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('loading');

    document.getElementById('fetch-images').addEventListener('click', async () => search());
    //document.addEventListener('scroll', search);
    document.addEventListener('keyup', event => {
        //console.info(event);
        // keyCode is deprecated
        if (event.key === "Escape") {
            window.ipcRenderer.send('close');
        }
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
    console.log("Logic Loop");

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
            <a href="" class="glightbox" data-type="image">
                <img alt="" src="" class="image">
            </a>
        </div>`);
    //
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
                $container.querySelector('a').href = item?.link;
                modifiedGallery = true;
            }
        } catch (err) {
            console.error(err);
            break;
        }

        // we might not have been able to fill all the elements, in this case we need to rerun again
    }

    if(modifiedGallery)
    {
        initializeLightBox();
    }

}
