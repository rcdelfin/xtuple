// ==========================================================================
// Project:   xTuple Postbooks - Business Management System Framework        
// Copyright: ©2012 OpenMFG LLC, d/b/a xTuple                             
// ==========================================================================

/*globals XM */

/**
  @scope XM.ItemConversion
  @mixin

  This code is automatically generated and will be over-written. Do not edit directly.
*/
XM._ItemConversion = {
  /** @scope XM.ItemConversion.prototype */
  
  className: 'XM.ItemConversion',

  

  // .................................................
  // PRIVILEGES
  //

  privileges: {
    "all": {
      "create": true,
      "read": true,
      "update": true,
      "delete": true
    }
  },

  //..................................................
  // ATTRIBUTES
  //
  
  /**
    @type Number
  */
  guid: SC.Record.attr(Number),

  /**
    @type XM.Item
  */
  item: SC.Record.toOne('XM.Item', {
    label: '_item'.loc()
  }),

  /**
    @type XM.Unit
  */
  fromUnit: SC.Record.toOne('XM.Unit', {
    label: '_fromUnit'.loc()
  }),

  /**
    @type Number
  */
  fromValue: SC.Record.attr(Number, {
    label: '_fromValue'.loc()
  }),

  /**
    @type XM.Unit
  */
  toUnit: SC.Record.toOne('XM.Unit', {
    label: '_toUnit'.loc()
  }),

  /**
    @type Number
  */
  toValue: SC.Record.attr(Number, {
    label: '_toValue'.loc()
  }),

  /**
    @type Boolean
  */
  fractional: SC.Record.attr(Boolean, {
    label: '_fractional'.loc()
  })

};
