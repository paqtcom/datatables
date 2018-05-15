/**
 *  Bootstrap the application when the dom is ready.
 */
class Way2web {
    /**
     * Initialize all the diffrent components.
     */
    constructor() {
        this.tables = new DataTables();
    }
}

$(document).ready(() => {
    window.w2w = new Way2web();
});
