/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(["N/search", "SuiteScripts/pts_helper", "N/currentRecord"], function (search, util, currentRecord) {

    function fieldChanged(context) {
        try {
            var curRec = context.currentRecord
            if (context.sublistId == "item" && context.fieldId == "item") {
                var itemId = curRec.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "item"
                })


                if (itemId && itemId != "") {
                    var itemSer = search.lookupFields({
                        type: "item",
                        id: itemId,
                        columns: ["custitem_in_hsn_code"]
                    })

                    console.log("itemSer", itemSer);

                    var hsnCode = itemSer?.custitem_in_hsn_code
                    var hsnCodeVal = hsnCode.length > 0 ? hsnCode[0].value : ""

                    curRec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_in_hsn_code",
                        value: hsnCodeVal
                    })

                } else {
                    curRec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_in_hsn_code",
                        value: ""
                    })
                }

            }

        } catch (error) {
            log.error('Error in fieldChanged', error)
        }
    }


    function validateLine(context) {
        try {

            var curRec = currentRecord.get()

            if (context.sublistId == "item") {

                var hsnCode = curRec.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_in_hsn_code"
                })

                var gstRate = getGSTPercentage(hsnCode)
                log.debug("gstRate", gstRate)

                if (gstRate) {
                    var GST = Number(gstRate.replace("%", ""));
                    log.debug("GST", GST)

                     curRec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_tax",
                        value: GST
                    })
                }

            }

            return true;

        } catch (error) {
            log.error("Error in validateLine", error)
        }
    }

    function getGSTPercentage(params) {

        try {

            var gstSer = {
                type: "customrecord_in_gst_tax_rule",
                filters:
                    [
                        ["custrecord_in_gst_tax_rule_fk.custrecord_in_gst_rate_rule_hsn_code", "anyof", params]
                    ],
                columns:
                    [
                        "CUSTRECORD_IN_GST_TAX_RULE_FK.custrecord_in_gst_rate_rule_rate"
                    ]
            }

            var res = util.getSearch(gstSer.type, gstSer.filters, gstSer.columns)
            log.debug("res", res)
            return res.length > 0 ? res[0].CUSTRECORD_IN_GST_TAX_RULE_FK_custrecord_in_gst_rate_rule_rate_txt : ""




        } catch (error) {
            log.error("Error in getGSTPercentage", error)
        }

    }



    return {
        fieldChanged: fieldChanged,
        validateLine: validateLine
    }
});
