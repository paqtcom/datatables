/**
 *  Bootstrap the application when the dom is ready.
 */
class Way2web {
    /**
     * Initialize all the diffrent components.
     */
    constructor() {
        this.datatables = new DataTables();
    }
}

$(document).ready(() => {
    window.Way2web = new Way2web();
});
