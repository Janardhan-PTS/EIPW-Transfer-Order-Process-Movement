/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
/***********************************************************************
 * @description Calulates tax for items on preview tax button and on Save of record.
 *
 ****************************************************************************/

define([ 'N/currentRecord', 'N/record', 'N/search', "SuiteScripts/pts_helper"],
  
    function ( currentRecord, record, search, util) {

        // parameters for validatng if taxable
        const FORM_ID = ['250'];
        const TYPE = ['3'];
        

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */


        function pageInit(scriptContext) {
        }

 /**
         * Validation function to be executed when record is saved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @returns {boolean} Return true if record is valid
         *
         * @since 2015.2
         */
 function saveRecord(scriptContext) {
    try{
       // onclick_previewTax("alertFlag");
        return true;


    }catch(e){
        log.error("error on save record");
    }

 }

        /**
         * @description calculates the tax total and set the tax amount for items on button click
         */
        function onclick_previewTax(alertMsgFlag) {
            try {
                var curRec = currentRecord.get();
                let isTaxable = checkTaxable(curRec);
                console.log("isTaxable",isTaxable);
                if (isTaxable) {
                     var taxTotal =0;
                    let columns = ['item', 'custcol_in_hsn_code', 'amount', 'quantity', 'rate'];
                    var itemLines = util.getLines(curRec, 'item', columns);
                    log.debug("itemLines",itemLines);
                    let hsnCodes = [...new Set(
                        itemLines
                            .map(item => item.custcol_in_hsn_code)
                            .filter(code => code) // Removes empty, null, and undefined values
                    )];

                
                    if(hsnCodes.length==0){return;}
                    var taxData = fetchTaxRate(hsnCodes);
                    log.debug("taxData", taxData);
                    console.log("taxData",taxData);
                  
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
                                    taxTotal= taxTotal+itemTax;
                                    curRec.selectLine({ sublistId: 'item', line: lineNum });
                                    curRec.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_pts_eipw_trigstlineamount', // Adjust field ID based on your NetSuite setup
                                        value: itemTax
                                    });
                                    curRec.commitLine({ sublistId: 'item' });
                                }
                            }
                        }
                    });
                    log.debug("taxTotal",taxTotal);
                    console.log("taxTotal",taxTotal);
                    curRec.setValue({fieldId:'custbody_pts_eipw_stocktrnsfrtax',value:taxTotal.toFixed(2)});
                }
                else {
                    log.debug("isNullorDefault(alertMsgFlag)",isNullorDefault(alertMsgFlag));
                    if(isNullorDefault(alertMsgFlag)){
                    alert("Tax not applicable!");
                    }
                }

                
            } catch (err) {
                log.error({ title: "Error in onclick_previewTax", details: err.message });
            }
        }



        /**
         * @description check if the tax needs to be applied to the record based on the condition.
         * @param {*} curRec 
         * @returns 
         */
        function checkTaxable(curRec) {
            try {
         
                let formId = curRec.getValue({fieldId:'customform'});
                let type = curRec.getValue({fieldId:'custbody_pts_eipw_type_'});
                let fromLocation = curRec.getValue({fieldId:'location'});
                let toLocation = curRec.getValue({fieldId:'transferlocation'});
                let displayObj = {
                    formId: formId,
                    type:type,
                    fromLocation:fromLocation,
                    toLocation:toLocation
                };
                log.debug("is Taxable details",displayObj);
                //if((FORM_ID.indexOf()) && (TYPE.indexOf(type)>=0) && (fromLocation != toLocation) )
            //   if((TYPE.indexOf(type)>=0) && (fromLocation != toLocation) )
            //     {
            //         return true;
            //     }
                

             if (fromLocation != toLocation) { //(TYPE.indexOf(type) >= 0) && 
                    return true;
                }
                return false;

            } catch (e) {
                log.error("error on checkTaxable - CS", e);
            }
        }


        /**
         * @description fetches the tax rate for the given array of HSN or SAC codes
         * @param {*} taxArray 
         * @returns 
         */
        function fetchTaxRate(taxArray) {
            log.debug("hsnCodes", taxArray);
            console.log("hsnCodes",taxArray);
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

        return {
            saveRecord: saveRecord,
            onclick_previewTax: onclick_previewTax
        };
    });