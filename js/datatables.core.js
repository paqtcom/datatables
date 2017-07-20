/**
 * Making DataTables fun again.
 *
 * @param {object} $table
 * @param {object} userOptions
 * @param {object} translations
 *
 * @return {object}
 */
 // eslint-disable-next-line no-unused-vars
var DataTable = (function($table, userOptions, translations) {
    'use strict';

    var elements = {
        columnRowSelector: '.js-table-columns',
        filterRowSelector: '.js-table-filters'
    };

    var prefix = {
        throw: 'w2wDataTables: '
    };

    var defaultOptions = {
        language: 'en'
    };

    var globals = {
        options: $.extend({}, defaultOptions, userOptions || {}),
        source: $table.data('source'),
        autoReload: $table.data('auto-reload'),
        perPage: $table.data('per-page'),
        tableID: $table.attr('id'),
        serverSide: true,
        stateSaving: true,
        table: false
    };


    var functions = {
        /**
         * Check if all fields are ok.
         * Create the datatable.
         */
        init: function() {
            functions.hasRequirementsOrThrow();
            functions.makeTable();
        },

        /**
         * Check if all fields are ok.
         */
        hasRequirementsOrThrow: function() {
            var columnRow = $table.find(elements.columnRowSelector);

            if (typeof globals.source === 'undefined' || globals.source === '') {
                globals.serverSide = false;
            }

            if (typeof globals.tableID === 'undefined' || globals.tableID === '') {
                throw prefix.throw + 'missing id attribute!';
            }

            if (columnRow.length === 0) {
                throw prefix.throw + 'missing column row (' + elements.columnRowSelector + ')!';
            }

            if (typeof globals.autoReload !== 'undefined' && !globals.autoReload > 0) {
                throw prefix.throw + 'invalid reload interval!';
            }
            if (typeof globals.perPage !== 'undefined' && !globals.perPage > 0) {
                throw prefix.throw + 'invalid amount per page!';
            }
        },

        /**
         * Create the datatable.
         */
        makeTable: function() {
            var tableColumns = functions.getColumns();
            var tableOrder = functions.getOrder();
            var tableLanguage = translations.get(globals.options.language);

            var dataTableConfig = {
                autoWidth: false,
                columns: tableColumns,
                initComplete: function() {
                    var table = this.api();
                    var filterRow = $table.find(elements.filterRowSelector);

                    if (filterRow.length > 0) {
                        functions.filterColumn(table);
                    }
                },
                language: tableLanguage,
                order: tableOrder,
                orderCellsTop: true,
                processing: true,
                responsive: true,
                serverSide: globals.serverSide,
                stateSave: globals.stateSaving
            };

            if(globals.serverSide == true) {
                dataTableConfig.ajax = {
                    method: 'POST',
                    url: globals.source
                };
            }

            // eslint-disable-next-line new-cap
            globals.table = $table.DataTable(dataTableConfig);

            if (typeof globals.autoReload !== 'undefined') {
                functions.bindReload(globals.autoReload);
            }

            if (typeof globals.perPage !== 'undefined') {
                functions.setPageLength();
            }

            globals.table.on('init.dt', function() {
                functions.triggerEvent('init.dt');
            });

            // once the table has been drawn, ensure a responsive reculcation
            // if we do not do this, pagination might cause columns to go outside the table
            globals.table.on('draw.dt', function() {
                functions.triggerEvent('draw.dt');
            });

            globals.table.on('responsive-resize', function() {
                functions.triggerEvent('responsive-resize');
            });
        },

        addEvent: function(on, fn) {
            if(!events[on]) {
                events[on] = [];
            }

            events[on].push(fn);
        },

        triggerEvent: function(on) {
            if(!events[on]) {
                return;
            }

            $.each(events[on], function(index, fn) {
                fn();
            });
        },

        /**
         * Set the page length.
         */
        setPageLength: function() {
            globals.table.page.len(globals.perPage).draw();
        },

        /**
         * Get the columns.
         *
         * @return {array}
         */
        getColumns: function() {
            var tableColumns = $table.find(elements.columnRowSelector + ' th');
            var columns = [];

            tableColumns.each(function() {
                // set default options
                var defOrderable = true;
                var defSearchable = true;
                var validOptionsSortOrder = [
                    true,
                    false
                ];
                // get the column values
                var column = $(this);
                var columnName = column.data('name');
                var columnOrderable = column.data('orderable');
                var columnSearchable = column.data('searchable');

                if (typeof columnOrderable === 'undefined' ||
                    !validOptionsSortOrder.indexOf(columnOrderable)) {
                    columnOrderable = defOrderable;
                }

                if (typeof columnSearchable === 'undefined' ||
                    !validOptionsSortOrder.indexOf(columnSearchable)) {
                    columnSearchable = defSearchable;
                }

                columns.push({
                    data: columnName,
                    name: columnName,
                    orderable: columnOrderable,
                    searchable: columnSearchable
                });
            });

            return columns;
        },

        /**
         * Get the order.
         *
         * @return {array}
         */
        getOrder: function() {
            var defaultOrder = [
                [0, 'desc']
            ];
            var validSortOrders = ['asc', 'desc'];
            var sortColumn = $table.find('[data-default-sort="true"]');
            var sortColumnOrder = sortColumn.data('default-sort-order');

            if (sortColumn.length === 0) {
                // no custom sort column on this table - use the default settings
                return defaultOrder;
            }

            if (typeof sortColumnOrder === 'undefined') {
                throw prefix.throw +
                    'You must add a sorting order (default-sort-order="asc/desc")' +
                    ' if you are filtering on a custom column!';
            }

            if (validSortOrders.indexOf(sortColumnOrder) == -1) {
                throw prefix.throw +
                    'You must add a valid sorting order (asc/desc) if you are filtering on a custom column!';
            }

            return [
                [
                    sortColumn.index(),
                    sortColumnOrder
                ]
            ];
        },

        /**
         * Filter the columns.
         *
         * @param {object} table
         */
        filterColumn: function(table) {
            table
                .columns()
                .eq(0)
                .each(function(colIdx) {
                    var tableFilter = $table.find(elements.filterRowSelector + ' th:eq(' + colIdx + ')');

                    functions.initFilterSelect(table, colIdx, tableFilter);
                    functions.initFilterInput(table, colIdx, tableFilter);
                });
        },

        /**
         * Initialize the input filter.
         *
         * @param {object} table
         * @param {string} colIdx
         * @param {object} tableFilter
         */
        initFilterInput: function(table, colIdx, tableFilter) {
            var debouncedFiltering = functions.debounce(function(searchValue) {
                table
                    .column(colIdx)
                    .search(searchValue)
                    .draw();
            }, 250);

            tableFilter.find('.js-input-filter').on('input', function() {
                var input = $(this);
                var searchValue = input.val();

                debouncedFiltering(searchValue);
            });
        },

        /**
         * Initialize the select filter.
         *
         * @param {object} table
         * @param {string} colIdx
         * @param {object} tableFilter
         */
        initFilterSelect: function(table, colIdx, tableFilter) {
            tableFilter.find('.js-select-filter').on('change', function() {
                var select = $(this);
                var searchValue = select.val();

                table
                    .column(colIdx)
                    .search(searchValue)
                    .draw();
            });
        },

        /**
         * Bind the reload.
         *
         * @param {string} interval
         */
        bindReload: function(interval) {
            setInterval(function() {
                globals.table.ajax.reload();
            }, interval);
        },

        /**
         * Debounce a function.
         *
         * @param {object} func
         * @param {number} wait
         * @param {boolean} immediate
         *
         * @return {object}
         */
        debounce: function(func, wait, immediate) {
            var timeout;

            return function() {
                var context = this;
                var args = arguments;

                clearTimeout(timeout);
                timeout = setTimeout(function() {
                    timeout = null;
                    if (!immediate) {
                        func.apply(context, args);
                    }
                }, wait);
                if (immediate && !timeout) {
                    func.apply(context, args);
                }
            };
        },

        recalc: function() {
            globals.table.responsive.recalc();
        }
    };

    var events = {
        'draw.dt': [
            functions.recalc
        ]
    };

    return {
        options:   globals.options,
        functions: functions,
        element:   $table
    };
});
