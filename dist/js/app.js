"use strict";function _classCallCheck(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}var _createClass=function(){function e(e,t){for(var n=0;n<t.length;n++){var i=t[n];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,i.key,i)}}return function(t,n,i){return n&&e(t.prototype,n),i&&e(t,i),t}}(),DataTable=function(){function e(t,n,i,l){_classCallCheck(this,e),this.version="0.3.0",this.table=t,this.userOptions=n,this.eventOptions=i,this.translations=l,this.elements={columnRowSelector:".js-table-columns",filterRowSelector:".js-table-filters",filterSelectColumn:".js-select-filter",filterInputColumn:".js-input-filter"},this.prefix={throw:"w2wDataTables: "},this.defaultOptions={language:"en",stateSaving:!0,dom:'<"row"<"col-md-4"f><"col-md-4 col-md-offset-4 text-right">>trlip<"clear">',buttons:[]},this.globals={options:{},source:t.data("source"),columnFilter:t.data("column-filter"),autoReload:t.data("auto-reload"),perPage:t.data("per-page"),tableID:t.attr("id"),serverSide:!0,table:!1,state:!1,translations:{},debounceDelay:250},this.events={"draw.dt":[this.recalc.bind(this)],"init.dt":[],initComplete:[]}}return _createClass(e,[{key:"init",value:function(){this.globals.options=this.getOptions(),this.globals.translations=this.getTranslations(),this.globals.options.buttons=this.getFilters(),this.hasRequirementsOrThrow(),this.getEventOptions(),this.makeTable()}},{key:"getOptions",value:function(){return $.extend(this.defaultOptions,this.userOptions)}},{key:"getTranslations",value:function(){return this.translations.get(this.globals.options.language)}},{key:"getEventOptions",value:function(){$.each(this.eventOptions,function(e,t){this.events[e]=$.extend({},this.events[e],t||{})})}},{key:"hasRequirementsOrThrow",value:function(){var e=this.table.find(this.elements.columnRowSelector);if("undefined"!=typeof this.globals.source&&""!==this.globals.source||(this.globals.serverSide=!1),"undefined"==typeof this.globals.tableID||""===this.globals.tableID)throw this.prefix.throw+"missing id attribute!";if(0===e.length)throw this.prefix.throw+"missing column row ("+this.elements.columnRowSelector+")!";if("undefined"!=typeof this.globals.autoReload&&!this.globals.autoReload>0)throw this.prefix.throw+"invalid reload interval!";if("undefined"!=typeof this.globals.perPage&&!this.globals.perPage>0)throw this.prefix.throw+"invalid amount per page!"}},{key:"makeTable",value:function(){var e=this.getColumns(),t=this.getOrder(),n={autoWidth:!1,columns:e,initComplete:function(){var e=n.component.table.find(n.component.elements.filterRowSelector);e.length>0&&n.component.filterColumn(),n.component.triggerEvent("initComplete")},language:this.globals.translations,order:t,orderCellsTop:!0,processing:!0,responsive:!0,serverSide:this.globals.serverSide,stateSave:this.globals.options.stateSaving,dom:this.globals.options.dom,component:this},i=this;this.globals.options.buttons&&(n.buttons=this.globals.options.buttons),1==this.globals.serverSide&&(n.ajax={method:"POST",url:this.globals.source}),this.globals.table=this.table.DataTable(n),this.globals.state=this.globals.table.state.loaded(),this.setFilterValues(),"undefined"!=typeof this.globals.autoReload&&this.bindReload(this.globals.autoReload),"undefined"!=typeof this.globals.perPage&&(this.globals.options.perPage=this.globals.perPage),"undefined"!=typeof this.globals.options.perPage&&this.setPageLength(),this.globals.table.on("init.dt",function(){i.triggerEvent("init.dt")}),$.each(this.events,this.listenToEvent.bind(this)),1!=this.globals.serverSide&&this.filterColumn()}},{key:"addEvent",value:function(e,t){this.events[e]||(this.events[e]=[]),this.events[e].push(t)}},{key:"listenToEvent",value:function(e){var t=this;this.globals.table.on(e,function(){t.triggerEvent(e,arguments)})}},{key:"triggerEvent",value:function(e,t){this.events[e]&&$.each(this.events[e],function(e,n){n.apply(this,t)})}},{key:"setPageLength",value:function(){this.globals.table.page.len(this.globals.options.perPage).draw()}},{key:"getColumns",value:function(){var e=this.table.find(this.elements.columnRowSelector+" th"),t=[];return e.each(function(){var e=!0,n=!0,i=[!0,!1],l=$(this),s=l.data("name"),a=l.data("data"),o=l.data("orderable"),r=l.data("searchable");"undefined"==typeof a&&(a=s),"undefined"!=typeof o&&i.indexOf(o)||(o=e),"undefined"!=typeof r&&i.indexOf(r)||(r=n),t.push({data:a,name:s,orderable:o,searchable:r})}),t}},{key:"getOrder",value:function(){var e=[[0,"desc"]],t=["asc","desc"],n=this.table.find('[data-default-sort="true"]'),i=n.data("default-sort-order");if(0===n.length)return e;if("undefined"==typeof i)throw this.prefix.throw+'You must add a sorting order (default-sort-order="asc/desc") if you are filtering on a custom column!';if(t.indexOf(i)==-1)throw this.prefix.throw+"You must add a valid sorting order (asc/desc) if you are filtering on a custom column!";return[[n.index(),i]]}},{key:"filterColumn",value:function(){var e=this;e.globals.table&&e.globals.table.columns().eq(0).each(function(t){var n=e.table.find(e.elements.filterRowSelector+" th:eq("+t+")"),i=e.table.find(e.elements.columnRowSelector+" th:eq("+t+")");e.initFilterSelect(t,n),e.initFilterInput(t,n),e.initFilterVisible(t,i)})}},{key:"initFilterInput",value:function(e,t){var n=this,i=n.debounce(function(t,i){var l=$(this).val();i&&!l||n.globals.table.column(e).search(l).draw()},n.globals.debounceDelay);t.find(n.elements.filterInputColumn).on("input",i),t.find(n.elements.filterInputColumn).on("change",i),t.find(n.elements.filterInputColumn).each(i)}},{key:"initFilterSelect",value:function(e,t){var n=this,i=n.debounce(function(t,i){var l=$(this).val(),s="";i&&!l||(l&&(s="^"+l+"$"),n.globals.table.column(e).search(s,!0,!1).draw())},n.globals.debounceDelay);t.find(n.elements.filterSelectColumn).on("change",i),t.find(n.elements.filterSelectColumn).each(i)}},{key:"initFilterVisible",value:function(e,t){var n=t.data("visible");"undefined"==typeof n&&(n=!0),this.globals.table.column(e).visible(n)}},{key:"bindReload",value:function(e){setInterval(function(){this.globals.table.ajax.reload()},e)}},{key:"debounce",value:function(e,t,n){var i=void 0;return function(){var l=this,s=arguments;clearTimeout(i),i=setTimeout(function(){i=null,n||e.apply(l,s)},t),n&&!i&&e.apply(l,s)}}},{key:"recalc",value:function(){this.globals.table&&this.globals.table.responsive.recalc()}},{key:"setFilterValues",value:function(){var e=this;e.globals.state&&e.globals.state.columns&&$.each(e.globals.state.columns,function(t,n){var i=n.search.search;n.search.regex&&(i=i.slice(1,-1)),e.table.find(e.elements.filterRowSelector+" .form-control").eq(t).val(i)})}},{key:"getFilters",value:function(){var e=this.table.find(this.elements.columnRowSelector+" th"),t={},n=[],i=[],l=this;return l.globals.options.buttons&&(n=this.globals.options.buttons),e.each(function(){var e=$(l),n=e.data("name"),s=e.data("filter");return s?($.each(s.split("|"),function(e,i){t[i]||(t[i]=[]),t[i].indexOf(n+":name")<0&&t[i].push(n+":name")}),void i.push(n+":name")):void i.push(n+":name")}),$.each(t,function(e,t){var l=i.filter(function(e){return t.indexOf(e)<0});n.push({extend:"colvisGroup",text:e,show:t,hide:l})}),!jQuery.isEmptyObject(t)&&n.length>0&&n.push({extend:"colvisGroup",text:l.globals.translations.all,show:i,hide:[]}),1==l.globals.columnFilter&&n.push({extend:"colvis",text:'<i class="fa fa-columns"></i> '+l.globals.translations.columns}),n}},{key:"getTable",value:function(){return this.globals.table}}]),e}();
//# sourceMappingURL=app.js.map
