/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 *@author
 */

define(["SuiteScripts/pts_helper"], function (util) {

    function beforeLoad(context) {
        try {
            var form = context.form;
            var rec = context.newRecord;

            if (context.type !== context.UserEventType.EDIT) {
                return;
            }

            // Get From & To Locations
            var fromLoc = rec.getValue("location");
            var toLoc = rec.getValue("transferlocation");

            // Check locations dynamically
            var isFromDurga = checkLocation(fromLoc, "Durga");
            var isToSarsuna = checkLocation(toLoc, "Sars");

            var enableField = (isFromDurga && isToSarsuna);

            log.debug("Enable Field: ", enableField);

            var sublist = form.getSublist('item');

            log.debug("Sublist Fields: ", sublist

            )
            sublist.getField('custcol_pts_epiw_specific_gravity')
                .updateDisplayType({
                    displayType: enableField ? 'NORMAL' : 'DISABLED'
                });


        } catch (e) {
            log.error("BeforeLoad Error", e);
        }
    }

    /**
    * Check if a location belongs to a parent name (Dynamic)
    * @param {Number} location - internal ID of location
    * @param {String} parentPrefix - Example: "Durga" or "Sarsuna"
    */
    function checkLocation(location, parentPrefix) {
        try {

            const locSearch = {
                type: "location",
                filters: [
                    ["custrecord_parent_location_tmp.name", "startswith", parentPrefix]
                ],
                columns: [
                    {
                        name: "name",
                        join: "CUSTRECORD_PARENT_LOCATION_TMP"
                    },
                    "name"
                ]
            };

            const result = util.getSearch(
                locSearch.type,
                locSearch.filters,
                locSearch.columns
            );

            if (result.length > 0) {

                var loc = result.find(x => x.id == location);

                if (!loc) {
                    return false;
                }

                return true;
            }
            else {
                return false
            }

        } catch (error) {
            console.log("Error in checkLocation:", error);
            return false;
        }
    }

    return {
        beforeLoad: beforeLoad
    };
});
