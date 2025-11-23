class GoogleItemResult {
    /**
     * The kind of item this is.
     * @type {string} kind
     */
    kind

    /**
     * The title of the item.
     * @type {string}
     */
    title

    /**
     * The HTML title of the item. (escaped HTML)
     * @type {string}
     */
    htmlTitle

    /**
     * The direct URL to the image.
     * @type {string}
     */
    link

    /**
     * The display URL of the image.
     * @type {string}
     */
    displayLink

    /**
     * A snippet of text from the image.
     * @type {string}
     */
    snippet

    /**
     * The HTML snippet of text from the image. (escaped HTML)
     * @type {string}
     */
    htmlSnippet

    /**
     * The MIME type of the image.
     * @type {string}
     */
    mime

    /**
     * File format of the image.
     * @type {string}
     */
    fileFormat

    /**
     * The image details
     * @type {GoogleImageDetails}
     */
    image

    constructor(data) {
        this.kind = data.kind
        this.title = data.title
        this.htmlTitle = data.htmlTitle
        this.link = data.link
        this.displayLink = data.displayLink
        this.snippet = data.snippet
        this.htmlSnippet = data.htmlSnippet
        this.mime = data.mime
        this.fileFormat = data.fileFormat
        this.image = new GoogleImageDetails(data.image)
    }

}

class GoogleImageDetails {
    /**
     * The URL of the page where the image was found.
     */
    contextLink

    /**
     * Height of the original image.
     * @type {number}
     */
    height

    /**
     * Width of the original image.
     * @type {number}
     */
    width

    /**
     * Size of image in bytes
     * @type {number}
     */
    byteSize

    /**
     * The URL of the thumbnail image.
     * @type {string}
     */
    thumbnailLink

    /**
     * Height of the thumbnail image.
     */
    thumbnailHeight

    /**
     * Width of the thumbnail image.
     */
    thumbnailWidth

    constructor(data) {
        this.contextLink = data?.contextLink
        this.height = data?.height
        this.width = data?.width
        this.byteSize = data?.byteSize
        this.thumbnailLink = data?.thumbnailLink
        this.thumbnailHeight = data?.thumbnailHeight
        this.thumbnailWidth = data?.thumbnailWidth
    }
}

module.exports = {
    GoogleItemResult,
    GoogleImageDetails
}