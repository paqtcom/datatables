(function(Table) {
    'use strict';

    /**
     * Add datatables to the page with ajax.
     */

    // Object with the elements for the datatable.
    Table.elements = {
        tableSelector: '.js-datatable'
    };

    // The datatables will be stored in this array.
    Table.items = [];

    // Find the elements to connect the datatables.
    Table.init = function() {
        $(Table.elements.tableSelector).each(Table.find);
    };

    // Attach the DataTable core to the elements.
    Table.find = function() {
        var item = new DataTable(
            $(this),
            {
                language: 'en',
                dom:      '<\'row\'<\'col-sm-6\'l><\'col-sm-6\'f>>' +
                          '<\'row\'<\'col-sm-12\'tr>>' +
                          '<\'row\'<\'col-sm-5\'i><\'col-sm-7\'p>>',
                buttons: [
                    {
                        extend: 'csvHtml5',
                        text:   'CSV'
                    }, {
                        extend: 'excelHtml5',
                        text:   'Excel'
                    }, {
                        extend: 'pdfHtml5',
                        text:   'PDF'
                    }
                ]
            },
            {
                'draw.dt':      [drawOk],
                'initComplete': [initComplete]
            },
            Table.Translations
        );

        item.functions.init();
        Table.items.push(item);
    };

    /**
     * Example function called after an event.
     */
    function initComplete() {
        // eslint-disable-next-line no-console
        console.log('Init Complete');
    }

    /**
     * Example function called after an event.
     */
    function drawOk() {
        // eslint-disable-next-line no-console
        console.log('Draw OK');
    }
})(window.Way2web.Table = window.Way2web.Table || {});
