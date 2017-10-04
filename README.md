# DataTables
Making DataTables fun again.

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-stats]

## How to use this script:
 Create a new table in your view. It must follow the following markup:

```
<table class="js-datatable" data-source="/url/to/json/source" column-filter="true">
     <thead>
         <tr class="js-table-columns">
             <th data-name="id">ID</th>
             <th data-name="name" data-default-sort="true" data-default-sort-order="desc" data-filter="Test filter">Name</th>
             <th data-name="created_at" data-visible="false">Created at</th>
             <th data-name="blocked">Blocked</th>
         </tr>
     </thead>
     <tfoot>
         <tr class="js-table-filters">
             <th><input type="text" class="js-input-filter"></th>
             <th><input type="text" class="js-input-filter"></th>
             <th><input type="text" class="js-input-filter"></th>
             <th><input type="text" class="js-input-filter"></th>
             <th>
                 <select class="js-select-filter">
                     <option value="1">Yes</option>
                     <option value="0">No</option>
                 </select>
             </th>
             <th></th>
         </tr>
     </tfoot>
</table>
```

Javascript:
```
var translations = {
    get: function(languageCode) {
        return this[languageCode]();
    },

    nl: function() {
        return {
            'oPaginate': {
                'sFirst': 'Eerste',
                'sLast': 'Laatste',
                'sNext': 'Volgende',
                'sPrevious': 'Vorige'
            },
            'sEmptyTable': 'Geen resultaten aanwezig in de tabel',
            'sInfo': '_START_ tot _END_ van _TOTAL_ resultaten',
            'sInfoEmpty': 'Geen resultaten om weer te geven',
            'sInfoFiltered': ' (gefilterd uit _MAX_ resultaten)',
            'sInfoPostFix': '',
            'sInfoThousands': '.',
            'sLengthMenu': '_MENU_ resultaten weergeven',
            'sLoadingRecords': 'Een moment geduld aub - bezig met laden...',
            'sProcessing': 'Bezig...',
            'sSearch': 'Zoeken:',
            'sZeroRecords': 'Geen resultaten gevonden'
        };
    }
};

$('.js-datatable').each(function() {
    var item = new DataTable(
        $(this),
        {
            language: 'nl'
        },
        {},
        translations
    );

    item.functions.init();
});
```

## .js-datatable
 This script will look for the '.js-datatable' selector and make a datatable
 out of it. A data attribute "source" is required, with an URL.
 This is the URL the table will get his contents from.
 With the data attribute "column-filter" you can enable the the button to show/hide columns.


## .js-table-columns
 This is the selector the script uses to figure out how to map the json
 contents to the table. Each <th> must contain a data attribute "name" with
 server side name. By default sorting and searching is enable for a column.
 If you would like to disable this, add
 data-orderable="false" and/or data-searchable="false".
 If you would like to set a default sorting column, you can add the following
 attributes to that column:
 data-default-sort="true" to say that this is the default sort column
 data-default-sort-order="desc" to say the sort order
 data-visible="false" to say the field is hidden on load, with the data attribute data-column-filter you can enable the button to show the column.
 data-filter="Test filter" to add a filter button, to show only columns with this filter name. You can add multiple filter names per column, seperated with a |

## .js-table-filters
 This is the selector used to initialize input searching per column.
 If you want a column to be searchable, add:
 `<input>` with the ".js-input-filter" class for an input filter or a
 `<select>` with the ".js-select-filter" class for a dropdown filter

## Auto-reloading:
 You can let the table automaticly reload by adding: data-auto-reload="3000"
 Where 3000 can be any number of miliseconds.

## Rows per page:
 By default a table shows 10 records, to override this, you can add: data-per-page="20"
 Where 20 can be any number of items.

## DataTable parameters
 There are 4 parameters:

 * $table

 > This must be the table element, just a single element.

 * userOptions

 > This is an array, containt e.g. the language for the datatable.

 * eventOptions

 > This is an array, you can call functions on datatable event.
 > http://m.datatables.net/reference/event/

 * translations

 > This is the translations object, this contains e.g. the get function.
 > The get function from translations receives the language in the first parameter.
 > The get function must return an object with all the translation texts for datatable.


 ## Test the package.

 To test the package, clone the package to your system.
 Than run this command.

 ```
 npm run build
 ```

 This will copy the test files to the dist, and also build the package files include the dependencies.

 When this script is complete without errors, you can open `dist/index.html` in your browser.
 Open the dev tools, tab console, and you see all the results of the tests.

 If you only want to check the eslint rules, just run.

 ```
 npm run lint
 ```


 [downloads-image]: https://img.shields.io/npm/dt/way2web-datatables.svg
 [npm-url]: https://www.npmjs.com/package/way2web-datatables
 [npm-image]: https://img.shields.io/npm/v/way2web-datatables.svg
 [npm-stats]: https://npm-stat.com/charts.html?package=way2web-datatables
