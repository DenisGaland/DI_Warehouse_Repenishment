sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/ui/model/Filter",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox"
], function(Controller, History, Filter, JSONModel, FilterOperator, MessageBox) {
	"use strict";

	return Controller.extend("DI_Warehouse_Replenishment.controller.V_REDetail", {
		changeUnitAble: false,
		baseUnit: false,
		toConfirm: "",
		itemTO: "",
		scannedBin: "",
		nextBin: 1,
		scannedEAN: "",
		replqty: 0,
		toBin: "",
		onInit: function() {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("Target_REDetail").attachPatternMatched(this._onObjectMatched, this);
		},

		_onObjectMatched: function(oEvent) {
			var oView = this.getView();
			oView.bindElement({
				path: "/" + oEvent.getParameter("arguments").replPath,
				model: "ZREPLENISHMENT"
			});
			var o = this.getView().getBindingContext("ZREPLENISHMENT").getObject();
			if (o.Lgtkz === "PAL") {
				o.Lgtkz = "PAP";
			}
			this.scannedEAN = o.Ean;
			//var qtyod = parseInt(o.QtyDelta);
			var qtyod = parseInt(o.QtyOd) - parseInt(o.StkPicking);
			var stockmax = parseInt(o.StockMax);
			if (o.Vrkme !== "EA" && o.Umrez !== "0") {
				qtyod = qtyod / o.Umrez;
				stockmax = stockmax / o.Umrez;
			}
			this.replqty = qtyod;
			oView.byId("StockMax").setText(stockmax);
			oView.byId("QtyOD").setText(qtyod);
			if (o.Vrkme === "") {
				this.changeUnitAble = false;
			} else {
				this.changeUnitAble = true;
			}

			this.getView().byId("fromBinList").bindItems({
				path: "ZBINS>/REHeaderSet('" + o.Ean + "')/REHeaderFromBinNav",
				template: new sap.m.CustomListItem({
					content: [
						new sap.m.Text({
							text: "{ZBINS>Frombin}",
							width: "50%"
						}),
						new sap.m.Text({
							text: "{ZBINS>Amount}",
							width: "50%",
							textAlign: "Right"
						})
					]
				})
			});

			var config = this.getOwnerComponent().getManifest();
			var sServiceUrl = config["sap.app"].dataSources.ZFGREPLENISHMENT_SRV.uri;
			var oData = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
			var query = "/REHeaderSet('" + oView.byId("Ean").getText() + "')/REHeaderToBinNav";
			oData.read(query, null, null, true, function(response) {
				if (response.results.length > 0) {
					oView.byId("toBinList").bindItems({
						path: "ZBINS>/REHeaderSet('" + o.Ean + "')/REHeaderToBinNav",
						filters: new Filter({
							path: "Lgtyp",
							operator: FilterOperator.EQ,
							value1: o.Lgtkz
						}),
						and: true,
						template: new sap.m.CustomListItem({
							content: [
								new sap.m.Text({
									text: "{ZBINS>Tobin}",
									width: "50%"
								}),
								new sap.m.Text({
									text: "{ZBINS>Amount}",
									width: "50%",
									textAlign: "Right"
								})
							]
						})
					});
					jQuery.sap.delayedCall(1000, this, function() {
						oView.byId("searchBin").focus();
					});
				} else {
					oView.byId("initialhbox").setVisible(false);
					oView.byId("toBinList").setVisible(false);
					oView.byId("NoToBinSelect").setVisible(true);
					oView.byId("NoToBinSelect").bindItems({
						path: "ZBINS>/DestBinSet",
						filters: new Filter({
							path: "Lgtkz",
							operator: FilterOperator.EQ,
							value1: o.Lgtkz
						}),
						and: true,
						template: new sap.ui.core.Item({
							key: "{ZBINS>Lgpla}",
							text: "{ZBINS>Lgpla}"
						})
					});
				}
			}, function(error) {
				MessageBox.error(JSON.parse(error.response.body).error.message.value, {
					title: "Error"
				});
			});
		},

		NoToBinChange: function(evt) {
			var oView = this.getView();
			oView.byId("NoToBinSelect").setEnabled(false);
			oView.byId("initialhbox").setVisible(true);
			jQuery.sap.delayedCall(2000, this, function() {
				oView.byId("searchBin").focus();
			});
		},

		onBack: function() {
			this.getOwnerComponent().getModel("ZREPLENISHMENT").refresh();
			this.baseUnit = false;
			this.getView().byId("fromBinList").unbindItems();
			this.getView().byId("toBinList").unbindItems();
			this.nextBin = 1;
			this.initialize();
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();
			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("Target_REHeader", true);
			}
		},

		initialize: function() {
			var oView = this.getView();
			oView.byId("NoToBinSelect").setSelectedKey();
			oView.byId("destBinSelect").setSelectedKey();
			oView.byId("searchBin").setEnabled(true);
			oView.byId("searchBin").setValue("");
			oView.byId("searchEan").setVisible(false);
			oView.byId("searchEan").setValue("");
			oView.byId("eanLabel").setText("");
			oView.byId("destBinBox").setVisible(false);
			oView.byId("destBin").setValue("");
			oView.byId("qtyTO").setText("");
			oView.byId("qtyLabel").setText("");
			oView.byId("confirmbinBox").setVisible(false);
			oView.byId("ConfirmBin").setValue("");
			oView.byId("searchQty").setEnabled(false);
			oView.byId("searchQty").setValue("");
			oView.byId("deltaText").setText("");
			oView.byId("deltaQty").setText("");
			oView.byId("btnNext").setVisible(false);
			oView.byId("btnReturn").setVisible(false);
			oView.byId("btnPalletEmpty").setVisible(false);
			oView.byId("returnBinBox").setVisible(false);
			oView.byId("searchEan").setEnabled(true);
			oView.byId("ConfirmBin").setEnabled(true);
			oView.byId("initialhbox").setVisible(true);
			oView.byId("fromBinList").setVisible(true);
			oView.byId("toBinList").setVisible(true);
			oView.byId("tobintext").setVisible(true);
			oView.byId("frombintext").setVisible(true);
			oView.byId("btnEmpty").setVisible(false);
			oView.byId("DestBin").setValue("");
			oView.byId("searchReturnQty").setValue("");
			oView.byId("searchReturnQty").setEnabled(false);
			oView.byId("destBinSelect").setVisible(false);
			oView.byId("destBin").setVisible(true);
			oView.byId("ReturnBin").setValue("");
			oView.byId("confirmdestBin").setEnabled(true);
			oView.byId("toBinList").setVisible(true);
			oView.byId("tobintext").setVisible(true);
			oView.byId("fromBinList").setVisible(true);
			oView.byId("frombintext").setVisible(true);
			oView.byId("destbinBox").setVisible(false);
			oView.byId("destBinLabel").setText("");
			oView.byId("confirmdestBin").setValue("");
			oView.byId("searchdestQty").setValue("");
			oView.byId("destBinSelect").setEnabled(true);
			oView.byId("NoToBinSelect").setVisible(false);
			oView.byId("NoToBinSelect").setEnabled(true);
			oView.byId("DestBin").setEnabled(true);
			this.toBin = "";
		},

		changeUnit: function(evt) {
			var oView = this.getView();
			if (this.changeUnitAble === true) {
				var oContext = oView.getBindingContext("ZREPLENISHMENT");
				var qty = 0;
				if (this.baseUnit === false) {
					oView.byId("QtyOD").setText(parseInt(oView.byId("QtyOD").getText()) * parseInt(oContext.getProperty("Umrez")));
					oView.byId("StockMax").setText(parseInt(oView.byId("StockMax").getText()) * parseInt(oContext.getProperty("Umrez")));
					oView.byId("DisUnit").setText(oContext.getProperty("Meins"));
					oView.byId("fromBinList").getItems().forEach(function(row) {
						qty = row.getContent()[1].getText();
						row.getContent()[1].setText(qty * parseInt(oContext.getProperty("Umrez")));
					});
					oView.byId("toBinList").getItems().forEach(function(row) {
						qty = row.getContent()[1].getText();
						row.getContent()[1].setText(qty * parseInt(oContext.getProperty("Umrez")));
					});
					if (oView.byId("qtyTO").getText() !== "") {
						qty = parseInt(oView.byId("qtyTO").getText());
						oView.byId("qtyTO").setText(qty * parseInt(oContext.getProperty("Umrez")));
					}
					if (oView.byId("deltaQty").getText() !== "") {
						qty = parseInt(oView.byId("deltaQty").getText());
						oView.byId("deltaQty").setText(qty * parseInt(oContext.getProperty("Umrez")));
					}
					if (oView.byId("searchQty").getValue() !== "") {
						qty = parseInt(oView.byId("searchQty").getValue());
						oView.byId("searchQty").setValue(qty * parseInt(oContext.getProperty("Umrez")));
					}
					this.replqty = qty * parseInt(oContext.getProperty("Umrez"));
					this.baseUnit = true;
				} else {
					oView.byId("QtyOD").setText(parseInt(oView.byId("QtyOD").getText()) / parseInt(oContext.getProperty("Umrez")));
					oView.byId("StockMax").setText(parseInt(oView.byId("StockMax").getText()) / parseInt(oContext.getProperty("Umrez")));
					oView.byId("DisUnit").setText(oContext.getProperty("Vrkme"));
					oView.byId("fromBinList").getItems().forEach(function(row) {
						qty = row.getContent()[1].getText();
						row.getContent()[1].setText(qty / parseInt(oContext.getProperty("Umrez")));
					});
					oView.byId("toBinList").getItems().forEach(function(row) {
						qty = row.getContent()[1].getText();
						row.getContent()[1].setText(qty / parseInt(oContext.getProperty("Umrez")));
					});
					if (oView.byId("qtyTO").getText() !== "") {
						qty = parseInt(oView.byId("qtyTO").getText());
						oView.byId("qtyTO").setText(qty / parseInt(oContext.getProperty("Umrez")));
					}
					if (oView.byId("deltaQty").getText() !== "") {
						qty = parseInt(oView.byId("deltaQty").getText());
						oView.byId("deltaQty").setText(qty / parseInt(oContext.getProperty("Umrez")));
					}
					if (oView.byId("searchQty").getValue() !== "") {
						qty = parseInt(oView.byId("searchQty").getValue());
						oView.byId("searchQty").setValue(qty / parseInt(oContext.getProperty("Umrez")));
					}
					this.replqty = qty / parseInt(oContext.getProperty("Umrez"));
					this.baseUnit = false;
				}
			}
		},

		searchBin: function(evt) {
			var oView = this.getView();
			this.scannedBin = evt.getSource().getValue();
			var bin = this.scannedBin;
			var config = this.getOwnerComponent().getManifest();
			var sServiceUrl = config["sap.app"].dataSources.ZFGREPLENISHMENT_SRV.uri;
			var oData = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
			var query = "/BinCheckSet(Bin='" + bin + "',Ean='" + oView.byId("Ean").getText() + "',Meins='" + oView.byId("DisUnit").getText() +
				"')";
			oData.read(query, null, null, true, function(response) {
				if (response.Message === "OK") {
					oView.byId("searchBin").setEnabled(false);
					oView.byId("searchEan").setVisible(true);
					oView.byId("btnEmpty").setVisible(true);
					oView.byId("eanLabel").setText("Ean :");
					jQuery.sap.delayedCall(1000, this, function() {
						oView.byId("searchEan").focus();
					});
				} else {
					MessageBox.error(response.Message, {
						title: "Error",
						onClose: oView.byId("searchBin").focus(),
						styleClass: "",
						initialFocus: oView.byId("searchBin").focus()
					});
					oView.byId("searchBin").setValue("");
				}
			}, function(error) {
				MessageBox.error(JSON.parse(error.response.body).error.message.value, {
					title: "Error"
				});
			});
		},

		searchEan: function(evt) {
			var oController = this;
			var oView = this.getView();
			var ean = evt.getSource().getValue();
			var toConfirm = this.toConfirm;
			var itemTO = this.itemTO;
			var tobin = "";
			if (oView.byId("toBinList").getItems().length > 0) {
				tobin = oView.byId("toBinList").getItems()[0].getContent()[0].getBindingContext("ZBINS").getProperty("Tobin");
			} else {
				tobin = oView.byId("NoToBinSelect").getSelectedItem().getText();
			}
			var config = this.getOwnerComponent().getManifest();
			var sServiceUrl = config["sap.app"].dataSources.ZFGREPLENISHMENT_SRV.uri;
			var oData = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
			var query = "EanCheckSet(ScannedEan='" + evt.getSource().getValue() +
				"',Ean='" + ean +
				"',Meins='" + oView.byId("DisUnit").getText() +
				"',Frombin='" + oView.byId("searchBin").getValue() +
				"',Tobin='" + tobin + "')";
			oData.read(query, null, null, true, function(response) {
				if (response.Message === "OK") {
					oView.byId("btnEmpty").setVisible(false);
					if (oView.byId("DisUnit").getText() === "EA") {
						oView.byId("qtyTO").setText(response.Vsolm);
					} else {
						var qty = parseInt(response.Vsolm);
						oView.byId("qtyTO").setText(qty / parseInt(oView.byId("altme").getText()));
					}
					oView.byId("qtyLabel").setText("Qty :");
					oView.byId("searchEan").setEnabled(false);
					oView.byId("destbinBox").setVisible(true);
					oView.byId("destBinLabel").setText(response.Nlpla);
					oView.byId("confirmbinBox").setVisible(true);
					jQuery.sap.delayedCall(1000, this, function() {
						oView.byId("ConfirmBin").focus();
					});
					oController.updateTOItems(response.Tanum, response.Tapos);
				} else {
					MessageBox.error(response.Message, {
						title: "Error",
						onClose: oView.byId("searchBin").focus(),
						styleClass: "",
						initialFocus: oView.byId("searchBin").focus() // default
					});
					oView.byId("searchEan").setValue("");
				}
			}, function(error) {
				MessageBox.error(JSON.parse(error.response.body).error.message.value, {
					title: "Error"
				});
			});
		},

		updateTOItems: function(tanum, tapos) {
			this.toConfirm = tanum;
			this.itemTO = tapos;
		},

		confirmBin: function(evt) {
			var oView = this.getView();
			var scannedBin = evt.getSource().getValue();
			if (scannedBin !== oView.byId("destBinLabel").getText()) {
				var message = "Bin :" + scannedBin + " <> Dest Bin :" + oView.byId("destBinLabel").getText();
				MessageBox.error(message, {
					title: "Error"
				});
				oView.byId("ConfirmBin").setValue("");
			} else {
				this.toBin = scannedBin;
				oView.byId("ConfirmBin").setEnabled(false);
				oView.byId("searchQty").setEnabled(true);
				jQuery.sap.delayedCall(1000, this, function() {
					oView.byId("searchQty").focus();
				});
			}
		},

		searchQty: function(evt) {
			var oController = this;
			var oView = this.getView();
			var scannedQty = parseInt(evt.getSource().getValue());
			if (!isNaN(scannedQty) && scannedQty !== 0) {
				var toQty = parseInt(oView.byId("qtyTO").getText());
				var config = this.getOwnerComponent().getManifest();
				if (scannedQty >= this.replqty) {
					oView.byId("QtyOD").setText("0");
				} else {
					oView.byId("QtyOD").setText(this.replqty - scannedQty);
				}
				if (scannedQty > toQty) {
					var message = "Qty " + scannedQty + " is > to TO qty " + oView.byId("qtyTO").getText();
					MessageBox.error(message, {
						title: "Error", // default
						onClose: oView.byId("searchBin").focus(),
						styleClass: "", // default
						initialFocus: oView.byId("searchBin").focus() // default
					});
				} else {
					if (scannedQty < toQty) {
						oView.byId("deltaText").setText("Delta : ");
						oView.byId("deltaQty").setText(toQty - scannedQty);
						oView.byId("btnNext").setVisible(true);
						oView.byId("btnReturn").setVisible(true);
						oView.byId("btnPalletEmpty").setVisible(true);
					} else {
						var sServiceUrl = config["sap.app"].dataSources.ZFGREPLENISHMENT_SRV.uri;
						var oData = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
						var query = "/TOOperationSet(Action='E',Tanum='" +
							this.toConfirm + "',Tapos='',Qtyscanned=0,Qtydelta=0,Unit='',Matnr='',Meins='',Nextbin='',Nlpla='')";
						oData.read(query, null, null, true, function(response) {
							MessageBox.error(response.Message, {
								title: "Error",
								onClose: function(evt2) {
									oController.onBack();
								},
								styleClass: "",
								initialFocus: oView.byId("searchBin").focus()
							});
						}, function(error) {
							MessageBox.error(JSON.parse(error.response.body).error.message.value, {
								title: "Error",
								styleClass: ""
							});
						});
					}
				}
			} else {
				evt.getSource().setValue("");
			}
		},

		qtyPress: function(evt) {
			evt.getSource().attachBrowserEvent("keypress", function(e) {
				var key_codes = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 0, 8];
				if (!($.inArray(e.which, key_codes) >= 0)) {
					e.preventDefault();
				}
			});
		},

		nextbin: function() {
			var oView = this.getView();
			this.nextBin = this.nextBin + 1;
			oView.byId("destBinSelect").setSelectedKey();
			oView.byId("destBinSelect").setVisible(false);
			oView.byId("destBin").setValue("");
			oView.byId("confirmdestBin").setValue("");
			oView.byId("searchdestQty").setValue("");
			oView.byId("searchdestQty").setEnabled(false);
			if (this.nextBin <= oView.byId("toBinList").getItems().length) {
				this.toBin = oView.byId("toBinList").getItems()[this.nextBin - 1].getContent()[0].getText();
				this.TOOperation("N");
				oView.byId("toBinList").setVisible(false);
				oView.byId("tobintext").setVisible(false);
				oView.byId("fromBinList").setVisible(false);
				oView.byId("frombintext").setVisible(false);
				oView.byId("initialhbox").setVisible(false);
				oView.byId("confirmbinBox").setVisible(false);
				oView.byId("destbinBox").setVisible(false);
				oView.byId("destBinBox").setVisible(true);
				oView.byId("btnNext").setVisible(false);
				oView.byId("btnReturn").setVisible(false);
				oView.byId("btnPalletEmpty").setVisible(false);
				oView.byId("destBin").setValue(this.toBin);
				jQuery.sap.delayedCall(1000, this, function() {
					oView.byId("confirmdestBin").focus();
				});
			} else {
				var config = this.getOwnerComponent().getManifest();
				var sServiceUrl = config["sap.app"].dataSources.ZFGREPLENISHMENT_SRV.uri;
				var oData = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
				var oFilter = new Filter("Lgtkz", FilterOperator.EQ, oView.byId("Lgtkz").getText());
				var query = "/DestBinSet";
				oData.read(query, {
					filters: [oFilter],
					success: function(oDataModel, response) {
						if (oDataModel.results.length > 0) {
							oView.byId("destBinSelect").setEnabled(true);
							oView.byId("searchEan").setVisible(false);
							oView.byId("eanLabel").setText("");
							oView.byId("destBinBox").setVisible(true);
							oView.byId("confirmbinBox").setVisible(false);
							oView.byId("searchQty").setEnabled(false);
							oView.byId("deltaText").setText("");
							oView.byId("initialhbox").setVisible(false);
							oView.byId("btnEmpty").setVisible(false);
							oView.byId("btnNext").setVisible(false);
							oView.byId("btnReturn").setVisible(false);
							oView.byId("btnPalletEmpty").setVisible(false);
							oView.byId("fromBinList").setVisible(false);
							oView.byId("toBinList").setVisible(false);
							oView.byId("tobintext").setVisible(false);
							oView.byId("frombintext").setVisible(false);
							oView.byId("destbinBox").setVisible(false);
							oView.byId("destBin").setVisible(false);
							oView.byId("destBinSelect").bindItems({
								path: "ZBINS>/DestBinSet",
								filters: new Filter({
									path: "Lgtkz",
									operator: FilterOperator.EQ,
									value1: oView.byId("Lgtkz").getText()
								}),
								and: true,
								template: new sap.ui.core.Item({
									key: "{ZBINS>Lgpla}",
									text: "{ZBINS>Lgpla}"
								})
							});
							oView.byId("destBinSelect").setVisible(true);
							//oView.byId("destBin").setVisible(false);		
						} else {
							MessageBox.error("No Destination bin available", {
								title: "Error",
								styleClass: ""
							});
						}

					}
				});
			}
		},

		confirmdestBin: function(evt) {
			var oView = this.getView();
			var scannedBin = evt.getSource().getValue();
			var tocomparebin = "";
			if (oView.byId("destBin").getValue() === "") {
				tocomparebin = oView.byId("destBinSelect").getSelectedItem().getText();
			} else {
				tocomparebin = oView.byId("destBin").getValue();
			}
			if (scannedBin === tocomparebin) {
				oView.byId("searchdestQty").setEnabled(true);
				oView.byId("confirmdestBin").setEnabled(false);
				jQuery.sap.delayedCall(1000, this, function() {
					oView.byId("searchdestQty").focus();
				});
			} else {
				MessageBox.error("Bin doesn't match Destination Bin", {
					title: "Error",
					onClose: function(evt2) {},
					styleClass: "",
					initialFocus: oView.byId("confirmdestBin").focus()
				});
			}
		},

		searchdestQty: function(evt) {
			var oController = this;
			var oView = this.getView();
			var scannedQty = parseInt(evt.getSource().getValue());
			var toQty = parseInt(oView.byId("qtyTO").getText());
			if (!isNaN(scannedQty) && scannedQty !== 0) {
				var config = this.getOwnerComponent().getManifest();
				if (scannedQty >= this.replqty) {
					oView.byId("QtyOD").setText("0");
				} else {
					oView.byId("QtyOD").setText(this.replqty - scannedQty);
				}
				if (scannedQty > toQty) {
					var message = "Qty " + scannedQty + " is > to TO qty " + oView.byId("qtyTO").getText();
					MessageBox.error(message, {
						title: "Error", // default
						onClose: oView.byId("searchBin").focus(),
						styleClass: "", // default
						initialFocus: oView.byId("searchBin").focus() // default
					});
				} else {
					if (scannedQty < toQty) {
						oView.byId("searchQty").setValue(scannedQty);
						oView.byId("deltaQty").setText(parseInt(oView.byId("deltaQty").getText()) - scannedQty);
						oView.byId("btnNext").setVisible(true);
						oView.byId("btnReturn").setVisible(true);
						oView.byId("btnPalletEmpty").setVisible(true);
					} else {
						var sServiceUrl = config["sap.app"].dataSources.ZFGREPLENISHMENT_SRV.uri;
						var oData = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
						var query = "/TOOperationSet(Action='E',Tanum='" +
							this.toConfirm + "',Tapos='',Qtyscanned=0,Qtydelta=0,Unit='',Matnr='',Meins='',Nextbin='',Nlpla='')";
						oData.read(query, null, null, true, function(response) {
							MessageBox.error(response.Message, {
								title: "Error",
								onClose: function(evt2) {
									oController.onBack();
								},
								styleClass: "",
								initialFocus: oView.byId("searchBin").focus()
							});
						}, function(error) {
							MessageBox.error(JSON.parse(error.response.body).error.message.value, {
								title: "Error",
								styleClass: ""
							});
						});
					}
				}
			} else {
				evt.getSource().setValue("");
			}
		},

		SelectDestBin: function(evt) {
			var oController = this;
			var oView = this.getView();
			var selectedBin = evt.getSource().getSelectedItem().getText();
			var config = this.getOwnerComponent().getManifest();
			var sServiceUrl = config["sap.app"].dataSources.ZFGREPLENISHMENT_SRV.uri;
			var oData = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
			var query = "/DestBinSet(Lgpla='" + selectedBin + "',Lgtkz='" + oView.byId("Lgtkz").getText() + "')";
			oData.read(query, null, null, true, function(response) {
				if (response.Message === "") {
					oView.byId("destBinSelect").setEnabled(false);
					oController.toBin = selectedBin;
					oController.TOOperation("N");
					oView.byId("confirmdestBin").setEnabled(true);
					jQuery.sap.delayedCall(1000, this, function() {
						oView.byId("confirmdestBin").focus();
					});
				} else {
					MessageBox.error(response.Message, {
						title: "Error"
					});
				}
			}, function(error) {
				MessageBox.error(JSON.parse(error.response.body).error.message.value, {
					title: "Error"
				});
			});
		},

		returnbin: function() {
			var oView = this.getView();
			oView.byId("destbinBox").setVisible(false);
			oView.byId("destBinLabel").setText("");
			this.TOOperation("R");
		},

		emptyPalletbin: function() {
			this.TOOperation("P");
		},

		TOOperation: function(Action) {
			var oController = this;
			var oView = this.getView();
			//var nlpla = "";
			/*if (this.nextBin <= oView.byId("toBinList").getItems().length) {
				//if (oView.byId("confirmdestBin").getValue() === "") {
				nlpla = oView.byId("toBinList").getItems()[this.nextBin - 1].getContent()[0].getText();
			} else {
				if (oView.byId("toBinList").getItems().length > 0) {
					nlpla = oView.byId("NoToBinSelect").getSelectedItem().getText();
				} else {
					nlpla = oView.byId("NoToBinSelect").getSelectedItem().getText();
				}
			}*/
			var config = this.getOwnerComponent().getManifest();
			var sServiceUrl = config["sap.app"].dataSources.ZFGREPLENISHMENT_SRV.uri;
			var oData = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
			var query = "/TOOperationSet(Action='" +
				Action + "',Tanum='" +
				this.toConfirm + "',Tapos='" +
				this.itemTO + "',Qtyscanned=" +
				parseInt(oView.byId("searchQty").getValue()) + ",Qtydelta=" +
				parseInt(oView.byId("deltaQty").getText()) + ",Unit='" +
				oView.byId("altme").getText() + "',Matnr='" +
				oView.byId("searchEan").getValue() + "',Meins='" +
				oView.byId("DisUnit").getText() + "',Nextbin='" +
				oView.byId("searchBin").getValue() + "',Nlpla='" +
				this.toBin + "')";
			oData.read(query, null, null, true, function(response) {
				if (Action !== "N") {
					if (response.Type === "O") {
						var oData2 = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
						var query2 = "/REHeaderSet('" + oView.byId("searchEan").getValue() + "')/REHeaderFromBinNav";
						oData2.read(query2, null, null, true, function(response2) {
							if (Action === "R") {
								oView.byId("searchEan").setVisible(false);
								oView.byId("eanLabel").setText("");
								oView.byId("destBinBox").setVisible(false);
								oView.byId("confirmbinBox").setVisible(false);
								oView.byId("searchQty").setEnabled(false);
								oView.byId("deltaText").setText("");
								oView.byId("initialhbox").setVisible(false);
								oView.byId("returnBinBox").setVisible(true);
								oView.byId("btnEmpty").setVisible(false);
								oView.byId("btnNext").setVisible(false);
								oView.byId("btnReturn").setVisible(false);
								oView.byId("btnPalletEmpty").setVisible(false);
								oView.byId("fromBinList").setVisible(false);
								oView.byId("toBinList").setVisible(false);
								oView.byId("tobintext").setVisible(false);
								oView.byId("frombintext").setVisible(false);
								oView.byId("ReturnBin").setValue(oView.byId("searchBin").getValue());
								oView.byId("btnEmpty").setVisible(false);
								oController.updateTOItems(response.Tanum, response.Tapos);
								jQuery.sap.delayedCall(1000, this, function() {
									oView.byId("DestBin").focus();
								});
							} else {
								if (response2.results.length > 0) {
									oView.byId("fromBinList").getModel("ZBINS").refresh();
									oView.byId("toBinList").getModel("ZBINS").refresh();
									oView.byId("destBinSelect").getModel("ZBINS").refresh();
									oView.byId("NoToBinSelect").getModel("ZBINS").refresh();
									oController.initialize();
								} else {
									oController.onBack();
								}
							}
						}, function(error) {
							MessageBox.error(JSON.parse(error.response.body).error.message.value, {
								title: "Error"
							});
						});
					} else {
						MessageBox.error(response.Message, {
							title: "Error",
							styleClass: ""
						});
					}
				} else {
					if (response.Type === "O") {
						oController.updateTOItems(response.Tanum, response.Tapos);
					}
				}
			}, function(error) {
				MessageBox.error(JSON.parse(error.response.body).error.message.value, {
					title: "Error"
				});
			});
		},

		returnBin: function(evt) {
			var oView = this.getView();
			var bin = evt.getSource().getValue();
			if (bin !== oView.byId("searchBin").getValue()) {
				MessageBox.error("Return bin doesn't match Original Scanned Bin", {
					title: "Error",
					onClose: function(evt2) {
						oView.byId("DestBin").setValue();
					}
				});
			} else {
				oView.byId("DestBin").setEnabled(false);
				oView.byId("searchReturnQty").setEnabled(true);
				jQuery.sap.delayedCall(1000, this, function() {
					oView.byId("searchReturnQty").focus();
				});
			}
		},

		searchReturnQty: function(evt) {
			var oController = this;
			var oView = this.getView();
			var config = this.getOwnerComponent().getManifest();
			var sServiceUrl = config["sap.app"].dataSources.ZFGREPLENISHMENT_SRV.uri;
			var oData = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
			var qty = parseInt(evt.getSource().getValue());
			if (!isNaN(qty) && qty !== 0) {
				var qtyDelta = parseInt(oView.byId("deltaQty").getText());
				//var nlpla = "";
				/*if (oView.byId("toBinList").getItems().length === 0) {
					nlpla = oView.byId("NoToBinSelect").getSelectedItem().getText();
				} else {
					if (this.nextBin <= oView.byId("toBinList").getItems().length) {
						nlpla = oView.byId("toBinList").getItems()[this.nextBin - 1].getContent()[0].getText();
					} else {
						
					}
				}*/
				/*if (this.nextBin <= oView.byId("toBinList").getItems().length) {
					//if (oView.byId("confirmdestBin").getValue() === "") {
					nlpla = oView.byId("toBinList").getItems()[this.nextBin - 1].getContent()[0].getText();
				} else {
					nlpla = oView.byId("NoToBinSelect").getSelectedItem().getText();
				}*/
				if (qty >= this.replqty) {
					oView.byId("QtyOD").setText("0");
				} else {
					oView.byId("QtyOD").setText(this.replqty - qty);
				}
				if (qty > qtyDelta || qty < qtyDelta) {
					var query = "/TOOperationSet(Action='" +
						"P',Tanum='" +
						this.toConfirm + "',Tapos='" +
						this.itemTO + "',Qtyscanned=" +
						qty + ",Qtydelta=" +
						qtyDelta + ",Unit='" +
						oView.byId("altme").getText() + "',Matnr='" +
						oView.byId("searchEan").getValue() + "',Meins='" +
						oView.byId("DisUnit").getText() + "',Nextbin='" +
						oView.byId("searchBin").getValue() + "',Nlpla='" +
						this.toBin + "')";
					oData.read(query, null, null, true, function(response) {
						oController.onBack();
					}, function(error) {
						MessageBox.error(JSON.parse(error.response.body).error.message.value, {
							title: "Error"
						});
					});
				} else {
					query = "/TOOperationSet(Action='E',Tanum='" +
						this.toConfirm + "',Tapos='',Qtyscanned=0,Qtydelta=0,Unit='',Matnr='',Meins='',Nextbin='',Nlpla='')";
					oData.read(query, null, null, true, function(response) {
						MessageBox.error(response.Message, {
							title: "Error",
							onClose: function(evt2) {
								oController.onBack();
							},
							styleClass: "",
							initialFocus: oView.byId("searchBin").focus()
						});
					}, function(error) {
						MessageBox.error(JSON.parse(error.response.body).error.message.value, {
							title: "Error",
							styleClass: ""
						});
					});
				}
			} else {
				evt.getSource().setValue("");
			}
		},

		emptybin: function() {
			var oController = this;
			var oView = this.getView();
			var number = 0;
			var config = this.getOwnerComponent().getManifest();
			var sServiceUrl = config["sap.app"].dataSources.ZFGREPLENISHMENT_SRV.uri;
			var oData = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
			oView.byId("fromBinList").getItems().forEach(function(row) {
				if (oView.byId("searchBin").getValue() === row.getContent()[0].getText()) {
					number = parseInt(row.getContent()[1].getText());
				}
			});
			var query = "/TOOperationSet(Action='" +
				"C',Tanum='',Tapos='',Qtyscanned=" +
				number + ",Qtydelta=" +
				"0,Unit='',Matnr='" +
				oView.byId("Ean").getText() + "',Meins='',Nextbin='" +
				oView.byId("searchBin").getValue() + "',Nlpla='')";
			oData.read(query, null, null, true, function(response) {
				if (response.Type === "O") {
					var oData2 = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
					var query2 = "/REHeaderSet('" + oView.byId("Ean").getText() + "')/REHeaderFromBinNav";
					oData2.read(query2, null, null, true, function(response2) {
						if (response2.results.length > 0) {
							oView.byId("fromBinList").getModel("ZBINS").refresh();
							oView.byId("toBinList").getModel("ZBINS").refresh();
							oView.byId("destBinSelect").getModel("ZBINS").refresh();
							oView.byId("NoToBinSelect").getModel("ZBINS").refresh();
							oController.initialize();
						} else {
							oController.onBack();
						}
					}, function(error) {
						MessageBox.error(JSON.parse(error.response.body).error.message.value, {
							title: "Error"
						});
					});
				} else {
					MessageBox.error(response.Message, {
						title: "Error",
						styleClass: ""
					});
				}
			}, function(error) {
				MessageBox.error(JSON.parse(error.response.body).error.message.value, {
					title: "Error"
				});
			});
		}
	});
});