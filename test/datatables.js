/**
 * Add datatables to the page with ajax.
 */
window.DataTables = class DataTables {
    /**
     * Initialize the datatables component.
     */
    constructor() {
        this.items = [];
        this.elements = {
            tableSelector: '.js-datatable'
        };

        $(this.elements.tableSelector).each(this.find.bind(this));
    }

    /**
     * Attach the DataTable core to the elements.
     *
     * @param {integer} index
     * @param {object} element
     */
    find(index, element) {
        let item = new DataTable(
            $(element),
            {
                language: 'en',
                dom: '<"row"<"col-md-4"f><"col-md-4 col-md-offset-4 text-right"B>>trlip<"clear">'
            },
            {},
            this.translations()
        );

        item.init();

        this.items.push(item);
    }

    /**
     * The translations object for the Datatbales package.
     *
     * @return {object}
     */
    translations() {
        return {
            /**
             * Get all the datatables translations with Lang.js.
             *
             * @return {object}
             */
            get() {
                return {
                    oAria: {
                        sSortAscending: ': activeer om kolom oplopend te sorteren',
                        sSortDescending: ': activeer om kolom aflopend te sorteren'
                    },
                    oPaginate: {
                        sFirst: 'Eerste',
                        sLast: 'Laatste',
                        sNext: 'Volgende',
                        sPrevious: 'Vorige'
                    },
                    sEmptyTable: 'Geen resultaten aanwezig in de tabel',
                    sInfo: '_START_ tot _END_ van _TOTAL_ resultaten',
                    sInfoEmpty: 'Geen resultaten om weer te geven',
                    sInfoFiltered: ' (gefilterd uit _MAX_ resultaten)',
                    sInfoPostFix: '',
                    sInfoThousands: '',
                    sLengthMenu: '_MENU_ resultaten weergeven',
                    sLoadingRecords: 'Een moment geduld aub - bezig met laden...',
                    sProcessing: 'Bezig...',
                    sSearch: 'Zoeken:',
                    sZeroRecords: 'Geen resultaten gevonden',
                    all: 'Alles',
                    columns: 'Kolommen'
                };
            }
        };
    }
};
