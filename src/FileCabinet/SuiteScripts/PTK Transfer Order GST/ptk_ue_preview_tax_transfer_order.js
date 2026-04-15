
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
/*******************************************************************
 *@description Created a button for 'Preview Tax' in transfer order on create and edit context ,
             Set the tax amounts for Transfer order.
 * ****************************************************************/

define(['N/currentRecord', 'N/search', "SuiteScripts/pts_helper"],
    /**
     * @param{currentRecord} currentRecord
     */
    (currentRecord, search, util) => {

        // parameters for validatng if taxable
        const FORM_ID = ['250'];
        const TYPE = ['3'];


        const beforeLoad = (scriptContext) => {
            /**
             * Defines the function definition that is executed before record is loaded.
             * @param {Object} scriptContext
             * @param {Record} scriptContext.newRecord - New record
             * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
             * @param {Form} scriptContext.form - Current form
             * @since 2015.2
             */

            if (scriptContext.type == 'create' || scriptContext.type == 'edit' || scriptContext.type == 'copy') {

                try {

                    if (scriptContext.type === 'copy') {
                        try {
                            // Empty field values for TaxAmount,taxtotal
                            let newRecord = scriptContext.newRecord;
                            newRecord.setValue({ fieldId: 'custbody_pts_eipw_stocktrnsfrtax', value: 0 });

                            let lineCount = newRecord.getLineCount({
                                sublistId: 'item'
                            });

                            for (let i = 0; i < lineCount; i++) {
                                newRecord.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_pts_eipw_trigstlineamount',
                                    value: 0,
                                    line: i
                                });
                            }

                        } catch (e) { log.error("error on copy context setting null value", e); }
                    }

                    // Add Button for Preview Tax

                    var form = scriptContext.form;

                    form.addButton
                        ({
                            id: "custpage_preview_tax_button",
                            label: "Preview Tax",
                            functionName: "onclick_previewTax"
                        });

                    //specify the id of Client Script to call onClick_approveEmail function
                    form.clientScriptFileId = "SuiteScripts/PTK Transfer Order GST/ptk_cs_calculate_tax_transfer_order.js";
                    // form.clientScriptModulePath = "SuiteScripts/";


                } catch (err) {
                    log.error({ title: "Error in Button Creation", details: err.message });
                }
            }
        }


        /**
              * Defines the function definition that is executed before record is submitted.
              * @param {Object} scriptContext
              * @param {Record} scriptContext.newRecord - New record
              * @param {Record} scriptContext.oldRecord - Old record
              * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
              * @since 2015.2
              */
        const beforeSubmit = (scriptContext) => {
            try {

                var oldRecord = scriptContext.oldRecord;
                var newRecord = scriptContext.newRecord;
                log.debug("new Record - beforeSubmit", newRecord);

                if (oldRecord !== newRecord) {

                    setTaxForItem(newRecord);


                }

            } catch (e) {
                log.error("error @ beforeSubmit", e);
            }

        }


        /**
             * @description check if the tax needs to be applied to the record based on the condition.
             * @param {*} curRec 
             * @returns 
             */
        function checkTaxable(curRec) {
            try {

                // let formId = curRec.getValue({ fieldId: 'customform' });
                let type = curRec.getValue({ fieldId: 'custbody_pts_eipw_type_' });
                let fromLocation = curRec.getValue({ fieldId: 'location' });
                let toLocation = curRec.getValue({ fieldId: 'transferlocation' });
                let displayObj = {
                    // formId: formId,
                    type: type,
                    fromLocation: fromLocation,
                    toLocation: toLocation
                };
                log.debug("is Taxable details - beforeSubmit", displayObj);
                //if((FORM_ID.indexOf()) && (TYPE.indexOf(type)>=0) && (fromLocation != toLocation) )
                if (fromLocation != toLocation) { //(TYPE.indexOf(type) >= 0) && 
                    return true;
                }

                return false;

            } catch (e) {
                log.error("error on checkTaxable- beforeSubmit", e);
            }
        }


        /**
           * @description calculates the tax total and set the tax amount for items on button click
           */
        function setTaxForItem(curRec) {
            try {

                let isTaxable = checkTaxable(curRec);
                log.debug("isTaxable", isTaxable);
                if (isTaxable) {
                    var taxTotal = 0;
                    let columns = ['item', 'custcol_in_hsn_code', 'amount', 'quantity', 'rate'];
                    var itemLines = util.getLines(curRec, 'item', columns);
                    log.debug("itemLines", itemLines);
                    let hsnCodes = [...new Set(
                        itemLines
                            .map(item => item.custcol_in_hsn_code)
                            .filter(code => code) // Removes empty, null, and undefined values
                    )];


                    if (hsnCodes.length == 0) { return; }
                    var taxData = fetchTaxRate(hsnCodes);
                    log.debug("taxData", taxData);


                    // calculate taxamount for each element and set taxTotal in line level
                    itemLines.forEach(function (element) {
                        // log.debug("element",element);
                        let lineNum = element.i;
                        let hsnCode = element.custcol_in_hsn_code;
                        let lineAmount = parseFloat(element.amount);
                        if (!isNullorDefault(hsnCode)) {
                            let taxRate = getTaxRate(taxData, hsnCode);
                            if (!isNullorDefault(taxRate)) {
                                let itemTax = calculateTax(lineAmount, taxRate);
                                // set lineTaxAmount 
                                if (itemTax > 0) {
                                    taxTotal = taxTotal + itemTax;
                                    //  curRec.selectLine({ sublistId: 'item', line: lineNum });
                                    curRec.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_pts_eipw_trigstlineamount', // Adjust field ID based on your NetSuite setup
                                        value: itemTax,
                                        line: lineNum
                                    });
                                    // curRec.commitLine({ sublistId: 'item' });
                                }
                            }
                        }
                    });
                    log.debug("taxTotal", taxTotal);

                    curRec.setValue({ fieldId: 'custbody_pts_eipw_stocktrnsfrtax', value: taxTotal.toFixed(2) });
                    // curRec.save({
                    //     enableSourcing: true,
                    //     ignoreMandatoryFields: true
                    // });
                }


            } catch (err) {
                log.error({ title: "Error in onclick_previewTax", details: err.message });
            }
        }

        /**
      * @description fetches the tax rate for the given array of HSN or SAC codes
      * @param {*} taxArray 
      * @returns 
      */
        function fetchTaxRate(taxArray) {
            log.debug("hsnCodes", taxArray);

            var taxDetails = [];
            var gstTaxSearchObj = search.create({
                type: "customrecord_in_gst_tax_rule",
                filters:
                    [
                        ["custrecord_in_gst_tax_rule_fk.custrecord_in_gst_rate_rule_available_on", "anyof", "2"],
                        "AND",
                        ["custrecord_in_gst_tax_rule_fk.custrecord_in_gst_rate_rule_com_reg_type", "anyof", "1"],
                        "AND",
                        ["custrecord_in_gst_tax_rule_fk.custrecord_in_gst_rate_rule_vend_regtype", "anyof", "1"],
                        "AND",
                        ["custrecord_in_gst_tax_rule_fk.isinactive", "is", "F"],
                        "AND",
                        ["custrecord_in_gst_tax_rule_fk.custrecord_in_gst_rate_rule_within_state", "is", "F"],
                        "AND",
                        ["custrecord_in_gst_tax_rule_fk.custrecord_in_gst_rate_rule_hsn_code", "anyof", taxArray]
                    ],
                columns:
                    [

                        search.createColumn({
                            name: "custrecord_in_gst_rate_rule_hsn_code",
                            join: "CUSTRECORD_IN_GST_TAX_RULE_FK",
                            label: "HSN or SAC Code"
                        }),

                        search.createColumn({
                            name: "custrecord_in_gst_rate_rule_rate",
                            join: "CUSTRECORD_IN_GST_TAX_RULE_FK",
                            label: "GST Rate"
                        }),

                    ]
            });
            // var searchResultCount = gstTaxSearchObj.runPaged().count;
            gstTaxSearchObj.run().each(function (result) {

                let taxCode = result.getValue({
                    name: "custrecord_in_gst_rate_rule_hsn_code",
                    join: "CUSTRECORD_IN_GST_TAX_RULE_FK",
                    label: "HSN or SAC Code"
                });

                let taxRate = result.getText({
                    name: "custrecord_in_gst_rate_rule_rate",
                    join: "CUSTRECORD_IN_GST_TAX_RULE_FK",
                    label: "GST Rate"
                });


                taxDetails.push({ "taxCode": taxCode, "taxRate": taxRate });

                return true;
            });

            log.debug("taxDetails", taxDetails);
            return taxDetails;
        }

        /**
         * @description pick the tax rate corresponding to the hsncode
         * @param {*} taxData 
         * @param {*} taxCode 
         * @returns 
         */
        function getTaxRate(taxData, taxCode) {

            if (!Array.isArray(taxData)) {
                log.error("taxData is not an array");
                return null;
            }
            let taxObj = taxData.find(item => item.taxCode === taxCode);
            return taxObj ? taxObj.taxRate : null; // Returns null if taxCode not found
        }

        /**
         * @description calculatesTax for given line
         * @param {*} amount 
         * @param {*} taxRateString 
         * @returns 
         */
        function calculateTax(amount, taxRateString) {
            // Extract number by removing "%" and converting to float
            let taxRate = parseFloat(taxRateString.replace("%", ""));

            let taxAmount = (amount * taxRate) / 100;

            return taxAmount;
        }



        /**
        * @description checks if given value is empty,null or undefined
        * @param {} s 
        * @returns {BOOLEAN} 
        */
        function isNullorDefault(s) {
            if (s == undefined || s == null || s == "" || Number(s) == 0)
                return true;
            else
                return false;
        }



        function fetchDataFromTO(recId) {
            try {
                var transferorderSearchObj = search.create({
                    type: "transferorder",
                    settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
                    filters:
                        [
                            ["type", "anyof", "TrnfrOrd"],
                            "AND",
                            ["internalid", "anyof", "4514"],
                            "AND",
                            ["mainline", "is", "F"],
                            "AND",
                            ["custcol_in_hsn_code", "noneof", "@NONE@"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "item", label: "Item" }),
                            search.createColumn({ name: "quantity", label: "Quantity" }),
                            search.createColumn({ name: "custcol_pts_eipw_trigstlineamount", label: "Tax Amount" })
                        ]
                });
                var searchResultCount = transferorderSearchObj.runPaged().count;
                log.debug("transferorderSearchObj result count", searchResultCount);
                transferorderSearchObj.run().each(function (result) {
                    // .run().each has a limit of 4,000 results
                    return true;
                });

                /*
                transferorderSearchObj.id="customsearch1737444489013";
                transferorderSearchObj.title="TO Transaction Search (copy)";
                var newSearchId = transferorderSearchObj.save();
                
                */
            } catch (e) { log.error("error on fetchDataFromTO", e); }
        }
        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit
        };

    });
