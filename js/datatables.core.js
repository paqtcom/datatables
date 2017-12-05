/**
 * Making DataTables fun again.
 *
 * @param {object} $table
 * @param {object} userOptions
 * @param {object} eventOptions
 * @param {object} translations
 *
 * @return {object}
 */
window.DataTable = function($table, userOptions, eventOptions, translations) {
    'use strict';

    var version = '0.2.4';

    var elements = {
        columnRowSelector:  '.js-table-columns',
        filterRowSelector:  '.js-table-filters',
        filterSelectColumn: '.js-select-filter',
        filterInputColumn:  '.js-input-filter'
    };

    var prefix = {
        throw: 'w2wDataTables: '
    };

    var defaultOptions = {
        language:    'en',
        stateSaving: true,
        dom:         '<"row"<"col-md-4"f><"col-md-4 col-md-offset-4 text-right">>trlip<"clear">',
        buttons:     []
    };

    var globals = {
        options:       {},
        source:        $table.data('source'),
        columnFilter:  $table.data('column-filter'),
        autoReload:    $table.data('auto-reload'),
        perPage:       $table.data('per-page'),
        tableID:       $table.attr('id'),
        serverSide:    true,
        table:         false,
        state:         false,
        translations:  {},
        debounceDelay: 250
    };

    var events = {
        'draw.dt': [
            recalc
        ],
        'init.dt':      [],
        'initComplete': []
    };

    /**
     * Check if all fields are ok.
     * Create the datatable.
     */
    function init() {
        globals.options = getOptions();
        globals.translations = getTranslations();
        globals.options.buttons = getFilters();
        hasRequirementsOrThrow();
        getEventOptions();
        makeTable();
    }

    /**
     * Get the options.
     *
     * @return {object}
     */
    function getOptions() {
        return $.extend(defaultOptions, userOptions);
    }

    /**
     * Get the translations.
     *
     * @return {object}
     */
    function getTranslations() {
        return translations.get(globals.options.language);
    }

    /**
     * Get the custom event options, and merge with the default the events.
     */
    function getEventOptions() {
        $.each(eventOptions, function(eventKey, eventOption) {
            events[eventKey] = $.extend({}, events[eventKey], eventOption || {});
        });
    }

    /**
     * Check if all fields are ok.
     */
    function hasRequirementsOrThrow() {
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
    }

    /**
     * Create the datatable.
     */
    function makeTable() {
        var tableColumns = getColumns();
        var tableOrder = getOrder();

        var dataTableConfig = {
            autoWidth:    false,
            columns:      tableColumns,
            initComplete: function() {
                var filterRow = $table.find(elements.filterRowSelector);

                if (filterRow.length > 0) {
                    filterColumn();
                }

                triggerEvent('initComplete');
            },
            language:      globals.translations,
            order:         tableOrder,
            orderCellsTop: true,
            processing:    true,
            responsive:    true,
            serverSide:    globals.serverSide,
            stateSave:     globals.options.stateSaving,
            dom:           globals.options.dom
        };

        if(globals.options.buttons) {
            dataTableConfig.buttons = globals.options.buttons;
        }

        if(globals.serverSide == true) {
            dataTableConfig.ajax = {
                method: 'POST',
                url:    globals.source
            };
        }

        // eslint-disable-next-line new-cap
        globals.table = $table.DataTable(dataTableConfig);

        globals.state = globals.table.state.loaded();

        setFilterValues();

        if (typeof globals.autoReload !== 'undefined') {
            bindReload(globals.autoReload);
        }

        if (typeof globals.perPage !== 'undefined') {
            setPageLength();
        }

        globals.table.on('init.dt', function() {
            triggerEvent('init.dt');
        });

        // once the table has been drawn, ensure a responsive reculcation
        // if we do not do this, pagination might cause columns to go outside the table
        $.each(events, listenToEvent);

        if(globals.serverSide != true) {
            filterColumn();
        }
    }

    /**
     * Add a new event.
     *
     * @param {string} on
     * @param {Function} fn
     */
    function addEvent(on, fn) {
        if(!events[on]) {
            events[on] = [];
        }

        events[on].push(fn);
    }

    /**
     * Listen to an event.
     *
     * @param {string} eventKey
     */
    function listenToEvent(eventKey) {
        globals.table.on(eventKey, function() {
            triggerEvent(eventKey, arguments);
        });
    }

    /**
     * Trigger an event.
     *
     * @param {key}   on
     * @param {array} eventArguments
     */
    function triggerEvent(on, eventArguments) {
        if(!events[on]) {
            return;
        }

        $.each(events[on], function(index, fn) {
            fn.apply(this, eventArguments);
        });
    }

    /**
     * Set the page length.
     */
    function setPageLength() {
        globals.table.page.len(globals.perPage).draw();
    }

    /**
     * Get the columns.
     *
     * @return {array}
     */
    function getColumns() {
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
            var columnData = column.data('data');
            var columnOrderable = column.data('orderable');
            var columnSearchable = column.data('searchable');

            if (typeof columnData === 'undefined') {
                columnData = columnName;
            }

            if (typeof columnOrderable === 'undefined' ||
                !validOptionsSortOrder.indexOf(columnOrderable)) {
                columnOrderable = defOrderable;
            }

            if (typeof columnSearchable === 'undefined' ||
                !validOptionsSortOrder.indexOf(columnSearchable)) {
                columnSearchable = defSearchable;
            }

            columns.push({
                data:       columnData,
                name:       columnName,
                orderable:  columnOrderable,
                searchable: columnSearchable
            });
        });

        return columns;
    }

    /**
     * Get the order.
     *
     * @return {array}
     */
    function getOrder() {
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
    }

    /**
     * Filter the columns.
     */
    function filterColumn() {
        if(!globals.table) {
            return;
        }

        globals.table
            .columns()
            .eq(0)
            .each(function(colIdx) {
                var tableFilter = $table.find(elements.filterRowSelector + ' th:eq(' + colIdx + ')');
                var tableColumn = $table.find(elements.columnRowSelector + ' th:eq(' + colIdx + ')');

                initFilterSelect(colIdx, tableFilter);
                initFilterInput(colIdx, tableFilter);
                initFilterVisible(colIdx, tableColumn);
            });
    }

    /**
     * Initialize the input filter.
     *
     * @param {string} colIdx
     * @param {object} tableFilter
     */
    function initFilterInput(colIdx, tableFilter) {
        var debouncedFiltering = debounce(function(columnEvent, input) {
            var searchValue = $(this).val();

            if(input && !searchValue) {
                return;
            }

            globals.table
                .column(colIdx)
                .search(searchValue)
                .draw();
        }, globals.debounceDelay);

        tableFilter.find(elements.filterInputColumn).on('input', debouncedFiltering);
        tableFilter.find(elements.filterInputColumn).on('change', debouncedFiltering);
        tableFilter.find(elements.filterInputColumn).each(debouncedFiltering);
    }

    /**
     * Initialize the select filter.
     *
     * @param {string} colIdx
     * @param {object} tableFilter
     */
    function initFilterSelect(colIdx, tableFilter) {
        var debouncedFiltering = debounce(function(columnEvent, input) {
            var searchValue = $(this).val();
            var regExSearch = '';

            if(input && !searchValue) {
                return;
            }

            if(searchValue) {
                regExSearch = '^' + searchValue + '$';
            }

            globals.table
                .column(colIdx)
                .search(regExSearch, true, false)
                .draw();
        }, globals.debounceDelay);

        tableFilter.find(elements.filterSelectColumn).on('change', debouncedFiltering);
        tableFilter.find(elements.filterSelectColumn).each(debouncedFiltering);
    }

    /**
     * Initialize if the column is visible.
     *
     * @param {string} colIdx
     * @param {object} tableColumn
     */
    function initFilterVisible(colIdx, tableColumn) {
        var visible = tableColumn.data('visible');

        if (typeof visible === 'undefined') {
            visible = true;
        }

        globals.table
            .column(colIdx)
            .visible(visible);
    }

    /**
     * Bind the reload.
     *
     * @param {string} interval
     */
    function bindReload(interval) {
        setInterval(function() {
            globals.table.ajax.reload();
        }, interval);
    }

    /**
     * Debounce a function.
     *
     * @param {object} func
     * @param {number} wait
     * @param {boolean} immediate
     *
     * @return {object}
     */
    function debounce(func, wait, immediate) {
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
    }

    /**
     * Recalc the table.
     */
    function recalc() {
        if(!globals.table) {
            return;
        }

        globals.table.responsive.recalc();
    }

    /**
     * Set the filter values.
     */
    function setFilterValues() {
        if(!globals.state || !globals.state.columns) {
            return;
        }

        $.each(globals.state.columns, function(column, value) {
            var searchValue = value.search.search;

            // On a dropdown, regex is used for the search, to receive only values with the exact value.
            // Check the function initFilterSelect, before and after the search value, a char is added.
            // We have to remove the first and last char from the saved search value to select the dropdown value.
            if(value.search.regex) {
                searchValue = searchValue.slice(1, -1);
            }

            $table.find(elements.filterRowSelector + ' .form-control')
                .eq(column)
                .val(searchValue);
        });
    }

    /**
     * Get the columns.
     *
     * @return {array}
     */
    function getFilters() {
        var tableColumns = $table.find(elements.columnRowSelector + ' th');
        var filters = {};
        var buttons = [];
        var allButtons = [];

        if(globals.options.buttons) {
            buttons = globals.options.buttons;
        }

        tableColumns.each(function() {
            var column = $(this);
            var columnName = column.data('name');
            var columnFilters = column.data('filter');

            if(!columnFilters) {
                allButtons.push(columnName + ':name');

                return;
            }

            $.each(columnFilters.split('|'), function(index, columnFilter) {
                if(!filters[columnFilter]) {
                    filters[columnFilter] = [];
                }

                if(filters[columnFilter].indexOf(columnName + ':name') < 0) {
                    filters[columnFilter].push(columnName + ':name');
                }
            });

            allButtons.push(columnName + ':name');
        });

        $.each(filters, function(filterName, fields) {
            var hideButtons = allButtons.filter(function(field) {
                return fields.indexOf(field) < 0;
            });

            buttons.push({
                extend: 'colvisGroup',
                text:   filterName,
                show:   fields,
                hide:   hideButtons
            });
        });

        if(!jQuery.isEmptyObject(filters) && buttons.length > 0) {
            buttons.push({
                extend: 'colvisGroup',
                text:   globals.translations.all,
                show:   allButtons,
                hide:   []
            });
        }

        if(globals.columnFilter == true) {
            buttons.push({
                extend: 'colvis',
                text:   '<i class="fa fa-columns"></i> ' + globals.translations.columns
            });
        }

        return buttons;
    }

    /**
     * Get the datatable object.
     *
     * @return {object}
     */
    function getTable() {
        return globals.table;
    }

    return {
        options:   globals.options,
        functions: {
            init:                   init,
            getOptions:             getOptions,
            getTranslations:        getTranslations,
            getEventOptions:        getEventOptions,
            hasRequirementsOrThrow: hasRequirementsOrThrow,
            makeTable:              makeTable,
            addEvent:               addEvent,
            listenToEvent:          listenToEvent,
            triggerEvent:           triggerEvent,
            setPageLength:          setPageLength,
            getColumns:             getColumns,
            getOrder:               getOrder,
            filterColumn:           filterColumn,
            initFilterInput:        initFilterInput,
            initFilterSelect:       initFilterSelect,
            bindReload:             bindReload,
            debounce:               debounce,
            recalc:                 recalc,
            setFilterValues:        setFilterValues,
            getFilters:             getFilters
        },
        element: $table,
        events:  events,
        table:   getTable,
        version: version
    };
};
