/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 *@author Janardhan
 */


define(["N/search", "SuiteScripts/pts_helper"],

    /**
     * Description
     * @param {any} search
     * @param {any} util
     * @author Janardhan
     * @returns {any}
     */
    function (search, util) {
        /**
         * Description
         * @param {any} context
         * @returns {any}
         * @author Janardhan
         */
        function pageInit(context) {
            try {
                const rec = context.currentRecord;

                // Run only in EDIT mode
                if (context.mode === "edit") {
                    enableSpecificGravity(rec, true); // TRUE = page load mode
                }

            } catch (e) {
                console.log("pageInit Error:", e);
            }
        }

        /**
         * Description
         * @param {any} context
         * @returns {any}
         * @author Janardhan
         */
        function validateField(context) {
            try {
                const rec = context.currentRecord;

                if (context.sublistId == "item" && context.fieldId == "item") {
                    enableSpecificGravity(rec);
                }
                return true

            } catch (e) {
                console.log("validateField Error:", e);
            }
        }

        function validateLine(context) {
            try {

                var currRec = context.currentRecord;

                var quantity = currRec.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "quantity"
                });

                var caseWeight = currRec.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_pts_eipw_itemplucsecasewt"
                }) || 0;

                var maxItemCase = currRec.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_pts_eipw_maxnoitemcase"
                }) || 0;

                if (quantity && caseWeight && maxItemCase) {
                    var totalItemWeight = Number(quantity) * Number(caseWeight) || 0;
                    currRec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_pts_eipw_totalweightofitem",
                        value: totalItemWeight
                    });

                    var totalCase = Number(quantity) / Number(maxItemCase) || 0;
                    currRec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol5",
                        value: totalCase
                    });


                    // var totalWeight = totalCase * totalItemWeight || 0;

                    // currRec.setCurrentSublistValue({
                    //     sublistId: "item",
                    //     fieldId: "custcol_pts_eipw_totalweight",
                    //     value: totalWeight
                    // });

                    console.log("Final Weight Detas: ", {
                        quantity,
                        caseWeight,
                        maxItemCase,
                        totalItemWeight,
                        totalCase,
                        // totalWeight
                    })

                }


                var specificGravity = currRec.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_pts_epiw_specific_gravity"
                }) || 0;

                if (specificGravity) {

                    var weight = Number(quantity) * Number(specificGravity);
                    currRec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcolpts_eipw_weight",
                        value: weight
                    });

                    console.log("Specific Gravity: ", specificGravity)

                }

                return true

            } catch (error) {
                log.error("Error in Validate Line", error)
            }
        }

        /**
         * Description
         * @param {any} rec
         * @returns {any}
         * @author Janardhan
         */
        function enableSpecificGravity(rec) {

            try {
                const fromLoc = rec.getValue("location");
                const toLoc = rec.getValue("transferlocation");

                // Dynamic check instead of static IDs
                const isFromDurga = checkLocation(fromLoc, "Durga");
                const isToSarsuna = checkLocation(toLoc, "Sars");

                console.log("From Loc: ", isFromDurga)
                console.log("To Loc: ", isToSarsuna)

                var enableField = (isFromDurga && isToSarsuna);

                var fieldObj = rec.getCurrentSublistField({
                    sublistId: "item",
                    fieldId: "custcol_pts_epiw_specific_gravity"
                });

                console.log("Fields: ", fieldObj)

                if (fieldObj) {

                    console.log("Enable Fields: ", !enableField)

                    fieldObj.isDisabled = !enableField;
                }

            } catch (error) {
                log.error("Error in Enable Specific Gravity Field", error)
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
                        search.createColumn({
                            name: "name",
                            join: "CUSTRECORD_PARENT_LOCATION_TMP"
                        }),
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
            validateField: validateField,
            validateLine: validateLine,
            pageInit: pageInit
            // fieldChanged: fieldChanged
        }
    });
