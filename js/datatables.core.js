/**
 * Making DataTables fun again.
 *
 * @return {object}
 */
class DataTable {
    /**
     * Initialize all the diffrent components.
     *
     * @param {object} $table
     * @param {object} userOptions
     * @param {object} eventOptions
     * @param {object} translations
     */
    constructor($table, userOptions, eventOptions, translations) {
        this.version = '0.3.0';

        this.table = $table;
        this.userOptions = userOptions;
        this.eventOptions = eventOptions;
        this.translations = translations;

        this.elements = {
            columnRowSelector: '.js-table-columns',
            filterRowSelector: '.js-table-filters',
            filterSelectColumn: '.js-select-filter',
            filterInputColumn: '.js-input-filter'
        };

        this.prefix = {
            throw: 'w2wDataTables: '
        };

        this.defaultOptions = {
            language: 'en',
            stateSaving: true,
            dom: '<"row"<"col-md-4"f><"col-md-4 col-md-offset-4 text-right">>trlip<"clear">',
            buttons: []
        };

        this.globals = {
            options: {},
            source: $table.data('source'),
            columnFilter: $table.data('column-filter'),
            autoReload: $table.data('auto-reload'),
            perPage: $table.data('per-page'),
            tableID: $table.attr('id'),
            serverSide: true,
            table: false,
            state: false,
            translations: {},
            debounceDelay: 250
        };

        this.events = {
            'draw.dt': [this.recalc],
            'init.dt': [],
            initComplete: []
        };
    }

    /**
     * Check if all fields are ok.
     * Create the datatable.
     */
    init() {
        this.globals.options = this.getOptions();
        this.globals.translations = this.getTranslations();
        this.globals.options.buttons = this.getFilters();
        this.hasRequirementsOrThrow();
        this.getEventOptions();
        this.makeTable();
    }

    /**
     * Get the options.
     *
     * @return {object}
     */
    getOptions() {
        return $.extend(this.defaultOptions, this.userOptions);
    }

    /**
     * Get the translations.
     *
     * @return {object}
     */
    getTranslations() {
        return this.translations.get(this.globals.options.language);
    }

    /**
     * Get the custom event options, and merge with the default the events.
     */
    getEventOptions() {
        $.each(this.eventOptions, function(eventKey, eventOption) {
            this.events[eventKey] = $.extend({}, this.events[eventKey], eventOption || {});
        });
    }

    /**
     * Check if all fields are ok.
     */
    hasRequirementsOrThrow() {
        var columnRow = this.table.find(this.elements.columnRowSelector);

        if (typeof this.globals.source === 'undefined' || this.globals.source === '') {
            this.globals.serverSide = false;
        }

        if (typeof this.globals.tableID === 'undefined' || this.globals.tableID === '') {
            throw this.prefix.throw + 'missing id attribute!';
        }

        if (columnRow.length === 0) {
            throw this.prefix.throw + 'missing column row (' + this.elements.columnRowSelector + ')!';
        }

        if (typeof this.globals.autoReload !== 'undefined' && !this.globals.autoReload > 0) {
            throw this.prefix.throw + 'invalid reload interval!';
        }
        if (typeof this.globals.perPage !== 'undefined' && !this.globals.perPage > 0) {
            throw this.prefix.throw + 'invalid amount per page!';
        }
    }

    /**
     * Create the datatable.
     */
    makeTable() {
        var tableColumns = this.getColumns();
        var tableOrder = this.getOrder();

        var dataTableConfig = {
            autoWidth: false,
            columns: tableColumns,

            /**
             * init complete.
             */
            initComplete: function() {
                var filterRow = this.table.find(this.elements.filterRowSelector);

                if (filterRow.length > 0) {
                    this.filterColumn();
                }

                this.triggerEvent('initComplete');
            },
            language: this.globals.translations,
            order: tableOrder,
            orderCellsTop: true,
            processing: true,
            responsive: true,
            serverSide: this.globals.serverSide,
            stateSave: this.globals.options.stateSaving,
            dom: this.globals.options.dom
        };

        if (this.globals.options.buttons) {
            dataTableConfig.buttons = this.globals.options.buttons;
        }

        if (this.globals.serverSide == true) {
            dataTableConfig.ajax = {
                method: 'POST',
                url: this.globals.source
            };
        }

        // eslint-disable-next-line new-cap
        this.globals.table = this.table.DataTable(dataTableConfig);

        this.globals.state = this.globals.table.state.loaded();

        this.setFilterValues();

        if (typeof this.globals.autoReload !== 'undefined') {
            this.bindReload(this.globals.autoReload);
        }

        if (typeof this.globals.perPage !== 'undefined') {
            this.globals.options.perPage = this.globals.perPage;
        }

        if (typeof this.globals.options.perPage !== 'undefined') {
            this.setPageLength();
        }

        this.globals.table.on('init.dt', function() {
            this.triggerEvent('init.dt');
        });

        // once the table has been drawn, ensure a responsive reculcation
        // if we do not do this, pagination might cause columns to go outside the table
        $.each(this.events, this.listenToEvent);

        if (this.globals.serverSide != true) {
            this.filterColumn();
        }
    }

    /**
     * Add a new event.
     *
     * @param {string} on
     * @param {Function} fn
     */
    addEvent(on, fn) {
        if (!this.events[on]) {
            this.events[on] = [];
        }

        this.events[on].push(fn);
    }

    /**
     * Listen to an event.
     *
     * @param {string} eventKey
     */
    listenToEvent(eventKey) {
        this.globals.table.on(eventKey, function() {
            this.triggerEvent(eventKey, arguments);
        });
    }

    /**
     * Trigger an event.
     *
     * @param {key}   on
     * @param {array} eventArguments
     */
    triggerEvent(on, eventArguments) {
        if (!this.events[on]) {
            return;
        }

        $.each(this.events[on], function(index, fn) {
            fn.apply(this, eventArguments);
        });
    }

    /**
     * Set the page length.
     */
    setPageLength() {
        this.globals.table.page.len(this.globals.options.perPage).draw();
    }

    /**
     * Get the columns.
     *
     * @return {array}
     */
    getColumns() {
        var tableColumns = this.table.find(this.elements.columnRowSelector + ' th');
        var columns = [];

        tableColumns.each(function() {
            // set default options
            var defOrderable = true;
            var defSearchable = true;
            var validOptionsSortOrder = [true, false];
            // get the column values
            var column = $(this);
            var columnName = column.data('name');
            var columnData = column.data('data');
            var columnOrderable = column.data('orderable');
            var columnSearchable = column.data('searchable');

            if (typeof columnData === 'undefined') {
                columnData = columnName;
            }

            if (typeof columnOrderable === 'undefined' || !validOptionsSortOrder.indexOf(columnOrderable)) {
                columnOrderable = defOrderable;
            }

            if (typeof columnSearchable === 'undefined' || !validOptionsSortOrder.indexOf(columnSearchable)) {
                columnSearchable = defSearchable;
            }

            columns.push({
                data: columnData,
                name: columnName,
                orderable: columnOrderable,
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
    getOrder() {
        var defaultOrder = [[0, 'desc']];
        var validSortOrders = ['asc', 'desc'];
        var sortColumn = this.table.find('[data-default-sort="true"]');
        var sortColumnOrder = sortColumn.data('default-sort-order');

        if (sortColumn.length === 0) {
            // no custom sort column on this table - use the default settings
            return defaultOrder;
        }

        if (typeof sortColumnOrder === 'undefined') {
            throw this.prefix.throw +
                'You must add a sorting order (default-sort-order="asc/desc")' +
                ' if you are filtering on a custom column!';
        }

        if (validSortOrders.indexOf(sortColumnOrder) == -1) {
            throw this.prefix.throw +
                'You must add a valid sorting order (asc/desc) if you are filtering on a custom column!';
        }

        return [[sortColumn.index(), sortColumnOrder]];
    }

    /**
     * Filter the columns.
     */
    filterColumn() {
        if (!this.globals.table) {
            return;
        }

        this.globals.table
            .columns()
            .eq(0)
            .each(function(colIdx) {
                var tableFilter = this.table.find(this.elements.filterRowSelector + ' th:eq(' + colIdx + ')');
                var tableColumn = this.table.find(this.elements.columnRowSelector + ' th:eq(' + colIdx + ')');

                this.initFilterSelect(colIdx, tableFilter);
                this.initFilterInput(colIdx, tableFilter);
                this.initFilterVisible(colIdx, tableColumn);
            });
    }

    /**
     * Initialize the input filter.
     *
     * @param {string} colIdx
     * @param {object} tableFilter
     */
    initFilterInput(colIdx, tableFilter) {
        var debouncedFiltering = this.debounce(function(columnEvent, input) {
            var searchValue = $(this).val();

            if (input && !searchValue) {
                return;
            }

            this.globals.table
                .column(colIdx)
                .search(searchValue)
                .draw();
        }, this.globals.debounceDelay);

        tableFilter.find(this.elements.filterInputColumn).on('input', debouncedFiltering);
        tableFilter.find(this.elements.filterInputColumn).on('change', debouncedFiltering);
        tableFilter.find(this.elements.filterInputColumn).each(debouncedFiltering);
    }

    /**
     * Initialize the select filter.
     *
     * @param {string} colIdx
     * @param {object} tableFilter
     */
    initFilterSelect(colIdx, tableFilter) {
        var debouncedFiltering = this.debounce(function(columnEvent, input) {
            var searchValue = $(this).val();
            var regExSearch = '';

            if (input && !searchValue) {
                return;
            }

            if (searchValue) {
                regExSearch = '^' + searchValue + '$';
            }

            this.globals.table
                .column(colIdx)
                .search(regExSearch, true, false)
                .draw();
        }, this.globals.debounceDelay);

        tableFilter.find(this.elements.filterSelectColumn).on('change', debouncedFiltering);
        tableFilter.find(this.elements.filterSelectColumn).each(debouncedFiltering);
    }

    /**
     * Initialize if the column is visible.
     *
     * @param {string} colIdx
     * @param {object} tableColumn
     */
    initFilterVisible(colIdx, tableColumn) {
        var visible = tableColumn.data('visible');

        if (typeof visible === 'undefined') {
            visible = true;
        }

        this.globals.table.column(colIdx).visible(visible);
    }

    /**
     * Bind the reload.
     *
     * @param {string} interval
     */
    bindReload(interval) {
        setInterval(function() {
            this.globals.table.ajax.reload();
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
    debounce(func, wait, immediate) {
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
    recalc() {
        if (!this.globals.table) {
            return;
        }

        this.globals.table.responsive.recalc();
    }

    /**
     * Set the filter values.
     */
    setFilterValues() {
        if (!this.globals.state || !this.globals.state.columns) {
            return;
        }

        $.each(this.globals.state.columns, function(column, value) {
            var searchValue = value.search.search;

            // On a dropdown, regex is used for the search, to receive only values with the exact value.
            // Check the function initFilterSelect, before and after the search value, a char is added.
            // We have to remove the first and last char from the saved search value to select the dropdown value.
            if (value.search.regex) {
                searchValue = searchValue.slice(1, -1);
            }

            this.table
                .find(this.elements.filterRowSelector + ' .form-control')
                .eq(column)
                .val(searchValue);
        });
    }

    /**
     * Get the columns.
     *
     * @return {array}
     */
    getFilters() {
        var tableColumns = this.table.find(this.elements.columnRowSelector + ' th');
        var filters = {};
        var buttons = [];
        var allButtons = [];

        if (this.globals.options.buttons) {
            buttons = this.globals.options.buttons;
        }

        tableColumns.each(function() {
            var column = $(this);
            var columnName = column.data('name');
            var columnFilters = column.data('filter');

            if (!columnFilters) {
                allButtons.push(columnName + ':name');

                return;
            }

            $.each(columnFilters.split('|'), function(index, columnFilter) {
                if (!filters[columnFilter]) {
                    filters[columnFilter] = [];
                }

                if (filters[columnFilter].indexOf(columnName + ':name') < 0) {
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
                text: filterName,
                show: fields,
                hide: hideButtons
            });
        });

        if (!jQuery.isEmptyObject(filters) && buttons.length > 0) {
            buttons.push({
                extend: 'colvisGroup',
                text: this.globals.translations.all,
                show: allButtons,
                hide: []
            });
        }

        if (this.globals.columnFilter == true) {
            buttons.push({
                extend: 'colvis',
                text: '<i class="fa fa-columns"></i> ' + this.globals.translations.columns
            });
        }

        return buttons;
    }

    /**
     * Get the datatable object.
     *
     * @return {object}
     */
    getTable() {
        return this.globals.table;
    }
}
