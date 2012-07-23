/*jshint bitwise:true, indent:2, curly:true eqeqeq:true, immed:true,
latedef:true, newcap:true, noarg:true, regexp:true, undef:true,
trailing:true white:true*/
/*global XV:true, Backbone:true, enyo:true, XT:true */

(function () {

  /**
   * Manages the main content pane of the workspace. This is implemented
   * as two panels (top and bottom). The code in this kind is general-purpose
   * across all possible workspaces, and so it takes its cues from a JSON
   * descriptor object called XT.WorkspacePanelDescriptor.
   */
  enyo.kind({
      name: "XV.WorkspacePanels",
      kind: "FittableRows",
      realtimeFit: true,
      wrap: false,
      classes: "panels enyo-border-box",
      published: {
        modelType: ""
      },
      events: {
        onFieldChanged: ""
      },
      components: [
        { kind: "Panels", name: "topPanel", style: "height: 300px;", arrangerKind: "CarouselArranger"},
        { kind: "Panels", fit: true, name: "bottomPanel", arrangerKind: "CarouselArranger"}
      ],
      /**
       * Set the layout of the workspace as soon as we know what the model is.
       * The layout is determined by the XV.util.getWorkspacePanelDescriptor() variable
       * in XT/foundation.js. This function is very much a work in progress. It
       * will have to accommodate every kind of input type.
       *
       */
      modelTypeChanged: function () {

        /**
         * Start by clearing out all of the panels
         */
        XV.util.removeAllChildren(this.$.topPanel);
        XV.util.removeAllChildren(this.$.bottomPanel);

        var box, boxRow, iField, iRow, fieldDesc, field, label;
        for (var iBox = 0; iBox < XV.util.getWorkspacePanelDescriptor()[this.modelType].length; iBox++) {
          var boxDesc = XV.util.getWorkspacePanelDescriptor()[this.modelType][iBox];
          if (boxDesc.boxType) {
            /**
             * Grids are a special case that must be rendered per their own logic.
             * All one-to-many relationships will be rendered as a grid (?)
             */
            box = this.createComponent({
                kind: XV.util.getFieldType(boxDesc.boxType),
                container: boxDesc.location === 'bottom' ? this.$.bottomPanel : this.$.topPanel,
                name: boxDesc.title
              });
            box.setDescriptor(boxDesc);

          } else {
            /**
             * General case: this box is not a grid, it's just a list of labeled fields
             */
            box = this.createComponent({
                kind: "onyx.Groupbox",
                container: boxDesc.location === 'bottom' ? this.$.bottomPanel : this.$.topPanel,
                style: "min-height: 250px; width: 400px; background-color: white; margin-right: 5px;",
                components: [
                  {kind: "onyx.GroupboxHeader", content: boxDesc.title}
                ]
              });
            for (iField = 0; iField < boxDesc.fields.length; iField++) {
              fieldDesc = boxDesc.fields[iField];

              label = fieldDesc.label ? "_" + fieldDesc.label : "_" + fieldDesc.fieldName;
              field = this.createComponent({
                kind: "onyx.InputDecorator",
                style: "font-size: 12px",
                container: box,
                components: [
                /**
                 * This is the label
                 */
                  { tag: "span", content: label.loc() + ": ", style: "padding-right: 10px;"}
                ]
              });

              var widget = this.createComponent({
                kind: XV.util.getFieldType(fieldDesc.fieldType),
                style: "border: 0px; ",
                name: fieldDesc.fieldName,
                container: field,
                onchange: "doFieldChanged",
                placeholder: fieldDesc.placeholder ? fieldDesc.placeholder : "Enter " + label.loc()
              });

              /**
               * Used only for DropdownWidgets at the moment. If the descriptor mentions a model
               * type we want to send that down to the widget
               */
              if (fieldDesc.modelType) {
                widget.setModelType(fieldDesc.modelType);
              }
            }
          }
        }
        this.render();
      },
      /**
       * Scrolls the display to the requested box.
       * @Param {String} name The title of the box to scroll to
       */
      gotoBox: function (name) {
        // fun! we have to find if the box is on the top or bottom,
        // and if so, which index it is. Once we know if it's in the
        // top or the bottom, and which index, it's easy to jump there.

        var topIndex = 0;
        var bottomIndex = 0;
        for (var iBox = 0; iBox < XV.util.getWorkspacePanelDescriptor()[this.modelType].length; iBox++) {
          var boxDesc = XV.util.getWorkspacePanelDescriptor()[this.modelType][iBox];

          // Note that if the box location defaults to top if it's left empty in the descriptor
          if (boxDesc.title === name && boxDesc.location === 'bottom') {
            this.$.bottomPanel.setIndex(bottomIndex);
            return;
          } else if (boxDesc.title === name) {
            this.$.topPanel.setIndex(topIndex);
            return;
          } else if (boxDesc.location === 'bottom') {
            bottomIndex++;
          } else {
            topIndex++;
          }
        }
      },
      /**
       * Populates the fields of the workspace with the values from the model
       */
      updateFields: function (model) {
        /**
         * Fields that are computed asynchronously by the model may not be
         * accurate right now, so we have those fields trigger an event when
         * they are set, which we listed for here
         */
        var that = this;
        model.on("announcedSet", function (announcedField, announcedValue) {
          console.debug(announcedField + " set to " + announcedValue);
          that.$[announcedField].setValue(announcedValue);
        });

        XT.log("update with model: " + model.get("type"));

        //
        // Look through the entire specification...
        //
        for (var iBox = 0; iBox < XV.util.getWorkspacePanelDescriptor()[this.modelType].length; iBox++) {
          var boxDesc = XV.util.getWorkspacePanelDescriptor()[this.modelType][iBox];

          if (boxDesc.boxType) {
            /**
             * Don't send just the field over. Send the whole collection over
             */
            this.$[boxDesc.title].setValue(model.getValue(boxDesc.objectName));
          } else {
            /**
             * Default case: populate the fields
             */

            for (var iField = 0; iField < boxDesc.fields.length; iField++) {
              var fieldDesc = boxDesc.fields[iField];
              var fieldName = boxDesc.fields[iField].fieldName;
              if (fieldName) {
                /**
                 * Update the view field with the model value
                 */
                this.$[fieldName].setValue(model.getValue(fieldName));
              }
            }
          }
        }
      }
    });

  enyo.kind({
      name: "XV.Workspace",
      kind: "Panels",
      classes: "app enyo-unselectable",
      realtimeFit: true,
      arrangerKind: "CollapsingArranger",
      published: {
        modelType: "",
        model: null
      },
      handlers: {
        onFieldChanged: "doFieldChanged",
        onModelUpdate: "doEnableSaveButton"
      },
      components: [

        {kind: "FittableRows", classes: "left", components: [


          {kind: "onyx.Toolbar", classes: "onyx-menu-toolbar", components: [
            {name: "workspaceHeader" },
            {kind: "onyx.MenuDecorator", components: [
              {content: "_navigation".loc() },
              {kind: "onyx.Tooltip", content: "Tap to open..."},
              {kind: "onyx.Menu", name: "navigationMenu", components: [
                { content: "Dashboard" },
                { content: "CRM" },
                { content: "Billing" }
              ], ontap: "doNavigationSelected" }
            ]}

          ]},
          {
            kind: "Repeater",
            fit: true,
            touch: true,
            onSetupItem: "setupItem",
            name: "menuItems",
            components: [
              { name: "item", classes: "item enyo-border-box", ontap: "itemTap"}
            ]
          }
        ]},
        {kind: "FittableRows", components: [
          {kind: "onyx.Toolbar", components: [
            {content: ""},
            {
              kind: "onyx.Button",
              name: "saveButton",
              disabled: true,
              content: "No Changes",
              classes: "onyx-affirmative",
              onclick: "doPersist"
            }
          ]},
          {kind: "XV.WorkspacePanels", name: "workspacePanels", fit: true}
        ]}
      ],
      create: function () {
        this.inherited(arguments);
      },
      rendered: function () {
        this.inherited(arguments);
      },
      /**
       * Update the model from changes to the UI. The interaction is handled here
       * and not in the widgets, which themselves are unaware of the model.
       * Exception: GridWidgets manage their own model, so those updates are not
       * performed here. The parameters coming in here are different if the sender
       * is an Input or a picker or a relational widget, so we have to be careful
       * when we parse out the appropriate values.
       * FIXME: If you click the persist button before a changed field is blurred,
       * then I think the change will not be persisted, as this function might not
       * be executed before the persist method. The way we disable the save button
       * until this function has successfully executed will help with this, but it's
       * not foolproof: let's say a user changes one field (which enables the save
       * button) and then changes a second but persists before blurring the second.
       */
      doFieldChanged: function (inSender, inEvent) {
        var prefix, suffix;

        var newValue = inEvent.getValue ? inEvent.getValue() :
          inEvent.getSelected ? inEvent.getSelected().value :
          inEvent.originator.model; // relational_widget

        var updateObject = {};

        // XXX isn't it strange that inEvent.name is the name of the field that's throwing the
        // event? both inEvent and inSender look like senders here. This is true for Inputs
        // and Pickers
        updateObject[inEvent.name] = newValue;
        this.getModel().set(updateObject);
        this.doEnableSaveButton();
      },
      doEnableSaveButton: function () {
        this.$.saveButton.setContent("Save Changes");
        this.$.saveButton.setDisabled(false);
      },
      /**
       * Persist the model (with whatever changes have been made) to the datastore.
       */
      doPersist: function () {
        this.getModel().save();
        this.$.saveButton.setContent("Changes Saved");
        this.$.saveButton.setDisabled(true);
        // XXX TODO This persist is not reflected in the Info objects in the summary view
      },
      // list
      setupItem: function (inSender, inEvent) {
        var title = XV.util.getWorkspacePanelDescriptor()[this.getModelType()][inEvent.index].title;
        inEvent.item.children[0].setContent(title);
        return true;
      },
      setWorkspaceList: function () {
        var menuItems = XV.util.getWorkspacePanelDescriptor()[this.getModelType()];
        this.$.menuItems.setCount(menuItems.length);
      },
      itemTap: function (inSender, inEvent) {
        var p = XV.util.getWorkspacePanelDescriptor()[this.getModelType()][inEvent.index];
        this.$.workspacePanels.gotoBox(p.title);
      },
      /**
       * Accepts the object that tells the workspace what to drill down into.
       * SetOptions is quite generic, because it can be called in a very generic
       * way from the main carousel event handler. Note also that the model parameter
       * doesn't need to be a complete model. It just has to have the appropriate
       * type and id properties
       */
      setOptions: function (model) {
        //
        // Determine the model that will back this view
        //
        var modelType = XV.util.infoToMasterModelName(model.recordType);

        //
        // Setting the model type also renders the workspace. We really can't do
        // that until we know the model type.
        //
        this.setModelType(modelType);
        this.$.workspaceHeader.setContent(("_" + modelType).loc());
        this.setWorkspaceList();
        this.$.menuItems.render();
        this.$.workspacePanels.setModelType(modelType);


        //
        // Set up a listener for changes in the model
        //
        var Klass = Backbone.Relational.store.getObjectByName(modelType);
        var m = new Klass();
        this.setModel(m);
        m.on("statusChange", enyo.bind(this, "modelDidChange"));


        //
        // Fetch the model
        //
        var id = model.id;
        if (id) {
          // id exists: pull pre-existing record for edit
          m.fetch({id: id});
          XT.log("Workspace is fetching " + modelType + " " + id);
        } else {
          // no id: this is a new record
          m.fetch();
          // on.change will never get called for a new model
          XT.log("Workspace is fetching new " + modelType);
        }


      },

      /**
       * Essentially the callback function from backbone
       */
      modelDidChange: function (model, value, options) {
        XT.log("Model changed: " + JSON.stringify(model.toJSON()));

        if (model.status !== XT.Model.READY_CLEAN &&
            model.status !== XT.Model.READY_NEW) {
          return;
        }
        // XXX this gets called for all the relational subobjects
        // as well and we don't really want to deal with those
        // because we've already dealt with them under the master
        // model. So I just ignore any calls to this function that
        // are not for the function in question. It'd be better if
        // I dealt with the reason this was getting called so much.
        //if (model.recordType !== this.getModelType()) {
        //  return;
        //}

        /**
         * Put the model in the history array
         */
        XT.addToHistory(model);


        /**
         * Pass this model onto the panels to update
         */
        this.$.workspacePanels.updateFields(model);
      },
      doNavigationSelected: function (inSender, inEvent) {
        var module = inEvent.originator.content.toLowerCase();
        this.bubble(module, {eventName: module});
      }

    });
}());
