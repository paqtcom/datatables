import $ from 'jquery';

import 'datatables.net/js/jquery.dataTables';
import 'datatables.net-bs4/js/dataTables.bootstrap4';

import 'datatables.net-buttons/js/dataTables.buttons';
import 'datatables.net-buttons-bs4/js/buttons.bootstrap4';
import 'datatables.net-buttons/js/buttons.colVis';
import 'datatables.net-buttons/js/buttons.html5';
import 'datatables.net-buttons/js/buttons.print';

import 'datatables.net-responsive/js/dataTables.responsive';
import 'datatables.net-responsive-bs4/js/responsive.bootstrap4';

/**
 * Way2Web DataTables package.
 */
class DataTable {
    /**
     * Initialize all the different components.
     *
     * @param {object} $table
     * @param {object} userOptions
     * @param {object} eventOptions
     * @param {object} translations
     */
    constructor($table, userOptions, eventOptions, translations) {
        this.version = '3.0.0';

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
            buttons: [],
            showAlertForXhrInactivity: true,
            handleXhrInactivity: () => {},
            showAlertForErrors: true,
            handleErrors: () => {}
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
            'draw.dt': [this.recalc.bind(this)],
            'init.dt': [],
            initComplete: [],
            'xhr.dt': [this.onXhr.bind(this)],
            'error.dt': [this.onError.bind(this)]
        };

        $.fn.dataTable.ext.errMode = 'none';
    }

    /**
     * Handle XHR results
     *
     * @param {*} e jQuery event object
     * @param {*} settings DataTables settings object
     * @param {*} json Data returned from the server. This will be null if triggered by the Ajax error callback.
     * @param {*} xhr jQuery XHR object that can be used to access the low level Ajax options.
     */
    onXhr(e, settings, json, xhr) {
        // Only validate the response when the request has been completed.
        // @see https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/readyState
        if (xhr.readyState !== 4) {
            return;
        }

        if (xhr.status === 200) {
            return;
        }

        if (xhr.status === 403 && xhr.responseJSON.error === 'CSRF token validation failed') {
            if (settings.oInit.showAlertForXhrInactivity) {
                alert('You need to refresh the page due to an extended period of inactivity');
            }

            settings.oInit.handleXhrInactivity();
        } else {
            if (settings.oInit.showAlertForErrors) {
                alert('Something went wrong. The administrator has been notified. Please try again later.');
            }

            settings.oInit.handleErrors();

            throw this.prefix.throw + 'Ajax call returned a ' + xhr.status + ' status code';
        }
    }

    /**
     * Handle DataTable errors
     *
     * Except 'Ajax errors' (http://datatables.net/tn/7), because we handle them ourselves in onXhr
     *
     * @param {*} e jQuery event object
     * @param {*} settings DataTables settings object
     * @param {*} techNote Tech note error number - use http://datatables.net/tn/{techNote} to look up a description
     * @param {*} message Description of error
     */
    onError(e, settings, techNote, message) {
        if (techNote !== 7) {
            if (settings.oInit.showAlertForErrors) {
                alert('Something went wrong. The administrator has been notified. Please try again later.');
            }

            settings.oInit.handleErrors();

            throw this.prefix.throw + message;
        }
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
        let columnRow = this.table.find(this.elements.columnRowSelector);

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
        let tableColumns = this.getColumns();
        let tableOrder = this.getOrder();

        let dataTableConfig = {
            autoWidth: false,
            columns: tableColumns,

            /**
             * init complete.
             */
            initComplete: function() {
                let filterRow = dataTableConfig.component.table.find(
                    dataTableConfig.component.elements.filterRowSelector
                );

                if (filterRow.length > 0) {
                    dataTableConfig.component.filterColumn();
                }

                dataTableConfig.component.triggerEvent('initComplete');
            },
            order: tableOrder,
            orderCellsTop: true,
            processing: true,
            responsive: true,
            serverSide: this.globals.serverSide,
            stateSave: this.globals.options.stateSaving,
            component: this
        };

        let component = this;

        $.extend(dataTableConfig, this.globals.options);
        dataTableConfig.language = this.globals.translations;

        if (this.globals.serverSide == true) {
            dataTableConfig.ajax = {
                method: 'POST',
                url: this.globals.source
            };
        }

        if (!this.table) {
            throw 'Unknown element for the datatable!';
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
            component.triggerEvent('init.dt');
        });

        // once the table has been drawn, ensure a responsive reculcation
        // if we do not do this, pagination might cause columns to go outside the table
        $.each(this.events, this.listenToEvent.bind(this));

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
        let component = this;

        this.globals.table.on(eventKey, function() {
            component.triggerEvent(eventKey, arguments);
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
        let tableColumns = this.table.find(this.elements.columnRowSelector + ' th');
        let columns = [];

        tableColumns.each(function() {
            // set default options
            let defOrderable = true;
            let defSearchable = true;
            let validOptionsSortOrder = [true, false];
            // get the column values
            let column = $(this);
            let columnName = column.data('name');
            let columnData = column.data('data');
            let columnOrderable = column.data('orderable');
            let columnSearchable = column.data('searchable');

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
        let defaultOrder = [[0, 'desc']];
        let validSortOrders = ['asc', 'desc'];
        let sortColumn = this.table.find('[data-default-sort="true"]');
        let sortColumnOrder = sortColumn.data('default-sort-order');

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
        let component = this;

        if (!component.globals.table) {
            return;
        }

        component.globals.table
            .columns()
            .eq(0)
            .each(function(colIdx) {
                let tableFilter = component.table.find(component.elements.filterRowSelector + ' th:eq(' + colIdx + ')');

                component.initFilterSelect(colIdx, tableFilter);
                component.initFilterInput(colIdx, tableFilter);
            });
    }

    /**
     * Initialize the input filter.
     *
     * @param {string} colIdx
     * @param {object} tableFilter
     */
    initFilterInput(colIdx, tableFilter) {
        let component = this;

        let debouncedFiltering = component.debounce(function(columnEvent, input) {
            const searchValue = $(this).val();

            if (input && !searchValue) {
                return;
            }

            component.globals.table
                .column(colIdx)
                .search(searchValue)
                .draw();
        }, component.globals.debounceDelay);

        tableFilter.find(component.elements.filterInputColumn).on('input', debouncedFiltering);
        tableFilter.find(component.elements.filterInputColumn).on('change', debouncedFiltering);
        tableFilter.find(component.elements.filterInputColumn).each(debouncedFiltering);
    }

    /**
     * Initialize the select filter.
     *
     * @param {string} colIdx
     * @param {object} tableFilter
     */
    initFilterSelect(colIdx, tableFilter) {
        let component = this;

        let debouncedFiltering = component.debounce(function(columnEvent, input) {
            let searchValue = $(this).val();

            if (input && !searchValue) {
                return;
            }

            component.globals.table
                .column(colIdx)
                .search(component.searchString(searchValue), true, false)
                .draw();
        }, component.globals.debounceDelay);

        tableFilter.find(component.elements.filterSelectColumn).on('change', debouncedFiltering);
        tableFilter.find(component.elements.filterSelectColumn).each(debouncedFiltering);
    }

    /**
     * Returns a delimited string from an array or the original search value.
     *
     * @param  {*} initialSearchValue
     * @param  {string} [delimiter='|']
     *
     * @return {*}
     */
    searchString(initialSearchValue, delimiter = '|') {
        let searchValue = initialSearchValue;

        if (!searchValue || (Array.isArray(searchValue) && searchValue.length < 1)) {
            return '';
        }

        if (Array.isArray(searchValue) && searchValue.length > 0) {
            searchValue = searchValue.join(delimiter);
        }

        return '^' + searchValue + '$';
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
        let timeout;

        return function() {
            let context = this;
            let args = arguments;

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
        let component = this;

        if (!component.globals.state || !component.globals.state.columns) {
            return;
        }

        $.each(component.globals.state.columns, function(column, value) {
            let searchValue = value.search.search;

            if (!searchValue) {
                return;
            }

            // On a dropdown, regex is used for the search, to receive only values with the exact value.
            // Check the function initFilterSelect, before and after the search value, a char is added.
            // We have to remove the first and last char from the saved search value to select the dropdown value.
            if (value.search.regex) {
                searchValue = searchValue.slice(1, -1);
            }

            component.table
                .find(component.elements.filterRowSelector + ' th')
                .eq(column)
                .find('.form-control')
                .val(searchValue);
        });
    }

    /**
     * Get the columns.
     *
     * @return {array}
     */
    getFilters() {
        let tableColumns = this.table.find(this.elements.columnRowSelector + ' th');
        let filters = {};
        let buttons = [];
        let allButtons = [];
        let component = this;

        if (component.globals.options.buttons) {
            buttons = this.globals.options.buttons;
        }

        tableColumns.each(function() {
            let column = $(component);
            let columnName = column.data('name');
            let columnFilters = column.data('filter');

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
            let hideButtons = allButtons.filter(function(field) {
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
                text: component.globals.translations.all,
                show: allButtons,
                hide: []
            });
        }

        if (component.globals.columnFilter == true) {
            buttons.push({
                extend: 'colvis',
                text: '<i class="fa fa-columns"></i> ' + component.globals.translations.columns
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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataTable;
}
