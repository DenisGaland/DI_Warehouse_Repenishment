sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	"sap/ui/model/odata/ODataModel",
	"sap/ui/model/json/JSONModel"
], function(Controller, Filter, FilterOperator, MessageBox, ODataModel, JSONModel) {
	"use strict";
	return Controller.extend("DI_Warehouse_Replenishment.controller.V_REHeader", {
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf DI_Warehouse_Replenishment.view.V_REHeader
		 */
		onInit: function() {
			this.getOwnerComponent().getModel("ZREPLENISHMENT").setSizeLimit(1000);
			
			var oView = this.getView();
			var oFormatYyyymmdd = sap.ui.core.format.DateFormat.getInstance({
				pattern: "yyyy-MM-dd",
				calendarType: sap.ui.core.CalendarType.Gregorian
			});
			oView.byId("currentDate").setText(oFormatYyyymmdd.format(new Date()));
			this.refreshDate();
		},

		/**
		 *@memberOf DI_Warehouse_Replenishment.controller.V_REHeader
		 */
		SelectStorageType: function() {
			var oTable = this.getView().byId("ContentTable");
			this.getView().byId("__button1").setEnabled(true);
			oTable.removeSelections(true);
			var key = this.getView().byId("oSelect").getSelectedItem().getText();
			var filters = [];
			filters.push(new Filter("Lgtkz", FilterOperator.EQ, key));
			var oFilter = new Filter(filters, true);
			var oBinding = oTable.getBinding("items");
			oBinding.filter(oFilter);

			oTable.attachUpdateFinished(function() {
				this.getItems().forEach(function(row) {
					var obj = row.getBindingContext("ZREPLENISHMENT").getObject();
					row.getCells()[7].removeStyleClass("green");
					row.getCells()[7].removeStyleClass("orange");
					row.getCells()[7].removeStyleClass("red");
					if (obj.Priority === 1) {
						row.getCells()[7].addStyleClass("green");
						//row.addStyleClass("highlightStyle");
					} else if (obj.Priority === 2) {
						row.getCells()[7].addStyleClass("orange");
					} else {
						row.getCells()[7].addStyleClass("red");
					}
				});
			}.bind(oTable));
			this.getView().byId("tableHeaderHBox").setVisible(true);
			this.getView().byId("tableContentHBox").setVisible(true);
		},

		showSelected: function(evt) {
			var oView = this.getView();
			if (oView.byId("ContentTable").getSelectedItem() !== null) {
				var path = oView.byId("ContentTable").getSelectedItem().getBindingContext("ZREPLENISHMENT").getPath().substr(1);
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("Target_REDetail", {
					replPath: path
				});
			} else {
				MessageBox.show("No line selected", sap.m.MessageBox.Icon.ERROR);
			}
		},

		refreshDate: function(evt) {
			var oFormatYyyymmdd = sap.ui.core.format.DateFormat.getInstance({
				pattern: "dd MM YYYY, h:mm:ss a",
				calendarType: sap.ui.core.CalendarType.Gregorian
			});
			this.getView().byId("lastRefresh").setText(oFormatYyyymmdd.format(new Date()));
		},

		RefreshTable: function(evt) {
			this.getView().byId("ContentTable").getModel("ZREPLENISHMENT").refresh();
			this.SelectStorageType();
			this.refreshDate();
		}
	});
});