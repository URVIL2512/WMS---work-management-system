// import mongoose from 'mongoose';

// const quotationSchema = new mongoose.Schema({
//   quotationNumber: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   quotationDate: {
//     type: Date,
//     default: Date.now
//   },
//   partyName: {
//     type: String,
//     required: [true, 'Party name is required'],
//     trim: true
//   },
//   billingAddress: {
//     type: String,
//     trim: true
//   },
//   email: {
//     type: String,
//     trim: true
//   },
//   contactNumber: {
//     type: String,
//     trim: true
//   },
//   itemDescription: {
//     type: String,
//     trim: true
//   },
//   // Support both single process (for backward compatibility) and multiple processes
//   process: {
//     type: String,
//     trim: true
//   },
//   rate: {
//     type: Number,
//     min: 0
//   },
//   // Multiple processes array
//   processes: [{
//     processName: {
//       type: String,
//       required: true,
//       trim: true
//     },
//     rate: {
//       type: Number,
//       required: true,
//       min: 0
//     },
//     quantity: {
//       type: Number,
//       default: 1,
//       min: 1
//     }
//   }],
//   gstPercent: {
//     type: Number,
//     default: 0,
//     min: 0,
//     max: 100
//   },
//   packagingCost: {
//     type: Number,
//     default: 0,
//     min: 0
//   },
//   transportCost: {
//     type: Number,
//     default: 0,
//     min: 0
//   },
//   paymentTerms: {
//     type: String,
//     trim: true
//   },
//   deliveryDate: {
//     type: Date
//   },
//   totalAmount: {
//     type: Number,
//     required: true,
//     min: 0
//   },
//   status: {
//     type: String,
//     enum: ['Draft', 'Sent', 'Approved', 'Rejected', 'Request Changes', 'Changes Required', 'Converted'],
//     default: 'Draft'
//   },
//   validUntil: {
//     type: Date
//   },
//   deliveryAddress: {
//     type: String,
//     trim: true
//   },
//   customerId: {
//     type: String,
//     trim: true
//   },
//   // Items array for multiple items
//   items: [{
//     itemId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Master',
//       required: false // Item Master reference
//     },
//     itemName: {
//       type: String,
//       trim: true
//     },
//     quantity: {
//       type: Number,
//       min: 1
//     },
//     unit: {
//       type: String,
//       trim: true,
//       default: 'PCS'
//     },
//     description: {
//       type: String,
//       trim: true
//     },
//     // Item-wise processes (one-to-many relationship)
//     processes: [{
//       processId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Master',
//         required: false // Process Master reference
//       },
//       processName: {
//         type: String,
//         required: true,
//         trim: true
//       },
//       processCost: {
//         type: Number,
//         required: true,
//         min: 0
//       },
//       processDescription: {
//         type: String,
//         trim: true
//       },
//       quantity: {
//         type: Number,
//         default: 1,
//         min: 1
//       },
//       processTotal: {
//         type: Number,
//         required: true,
//         min: 0
//       }
//     }],
//     // Legacy fields for backward compatibility
//     itemCode: {
//       type: String,
//       trim: true
//     },
//     itemDescription: {
//       type: String,
//       trim: true
//     },
//     process: {
//       type: String,
//       trim: true
//     },
//     rate: {
//       type: Number,
//       min: 0
//     },
//     subTotal: {
//       type: Number,
//       min: 0
//     },
//     taxRate: {
//       type: Number,
//       default: 0,
//       min: 0,
//       max: 100
//     },
//     taxAmount: {
//       type: Number,
//       default: 0,
//       min: 0
//     },
//     lineTotal: {
//       type: Number,
//       min: 0
//     },
//     // Item total (sum of all process totals)
//     itemTotal: {
//       type: Number,
//       default: 0,
//       min: 0
//     }
//   }],
//   totalSubTotal: {
//     type: Number,
//     default: 0,
//     min: 0
//   },
//   totalTaxAmount: {
//     type: Number,
//     default: 0,
//     min: 0
//   },
//   // Tax fields
//   tdsPercent: {
//     type: Number,
//     default: 0,
//     min: 0,
//     max: 100
//   },
//   tdsAmount: {
//     type: Number,
//     default: 0,
//     min: 0
//   },
//   tcsPercent: {
//     type: Number,
//     default: 0,
//     min: 0,
//     max: 100
//   },
//   tcsAmount: {
//     type: Number,
//     default: 0,
//     min: 0
//   },
//   remittanceCharges: {
//     type: Number,
//     default: 0,
//     min: 0
//   },
//   invoiceTotal: {
//     type: Number,
//     default: 0,
//     min: 0
//   },
//   receivableAmount: {
//     type: Number,
//     default: 0,
//     min: 0
//   },
//   currency: {
//     type: String,
//     default: 'INR',
//     trim: true
//   },
//   subject: {
//     type: String,
//     trim: true
//   },
//   customerNotes: {
//     type: String,
//     trim: true
//   },
//   termsAndConditions: {
//     type: String,
//     trim: true
//   },
//   createdBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   }
// }, {
//   timestamps: true
// });

// const Quotation = mongoose.model('Quotation', quotationSchema);
// export default Quotation;

// quotation.model.js


import mongoose from 'mongoose';

const quotationSchema = new mongoose.Schema({
  quotationNumber: {
    type: String,
    required: true,
    unique: true
  },
  quotationDate: {
    type: Date,
    default: Date.now
  },
  partyName: {
    type: String,
    required: [true, 'Party name is required'],
    trim: true
  },
  billingAddress: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  contactNumber: {
    type: String,
    trim: true
  },
  itemDescription: {
    type: String,
    trim: true
  },
  // Support both single process (for backward compatibility) and multiple processes
  process: {
    type: String,
    trim: true
  },
  rate: {
    type: Number,
    min: 0
  },
  // Multiple processes array
  processes: [{
    processName: {
      type: String,
      required: true,
      trim: true
    },
    rate: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    }
  }],
  gstPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  packagingCost: {
    type: Number,
    default: 0,
    min: 0
  },
  transportCost: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentTerms: {
    type: String,
    trim: true
  },
  deliveryDate: {
    type: Date
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Approved', 'Rejected', 'Request Changes', 'Changes Required', 'Converted'],
    default: 'Draft'
  },
  validUntil: {
    type: Date
  },
  deliveryAddress: {
    type: String,
    trim: true
  },
  customerId: {
    type: String,
    trim: true
  },
  // Items array for multiple items
  items: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Master',
      required: false // Item Master reference
    },
    itemName: {
      type: String,
      trim: true
    },
    quantity: {
      type: Number,
      min: 1
    },
    unit: {
      type: String,
      trim: true,
      default: 'PCS'
    },
    description: {
      type: String,
      trim: true
    },
    // Item-wise processes (one-to-many relationship)
    processes: [{
      processId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Master',
        required: false // Process Master reference
      },
      processName: {
        type: String,
        required: true,
        trim: true
      },
      processCost: {
        type: Number,
        required: true,
        min: 0
      },
      processDescription: {
        type: String,
        trim: true
      },
      quantity: {
        type: Number,
        default: 1,
        min: 1
      },
      processTotal: {
        type: Number,
        required: true,
        min: 0
      }
    }],
    // Legacy fields for backward compatibility
    itemCode: {
      type: String,
      trim: true
    },
    itemDescription: {
      type: String,
      trim: true
    },
    process: {
      type: String,
      trim: true
    },
    rate: {
      type: Number,
      min: 0
    },
    subTotal: {
      type: Number,
      min: 0
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    lineTotal: {
      type: Number,
      min: 0
    },
    // Item total (sum of all process totals)
    itemTotal: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  totalSubTotal: {
    type: Number,
    default: 0,
    min: 0
  },
  totalTaxAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  // Financial snapshot fields (calculated once in quotation, copied to order)
  itemTotal: {
    type: Number,
    default: 0,
    min: 0
  },
  processTotal: {
    type: Number,
    default: 0,
    min: 0
  },
  subtotal: {
    type: Number,
    default: 0,
    min: 0
  },
  gst: {
    type: Number,
    default: 0,
    min: 0
  },
  finalTotal: {
    type: Number,
    default: 0,
    min: 0
  },
  priceLocked: {
    type: Boolean,
    default: true
  },
  // Tax fields
  tdsPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  tdsAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  tcsPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  tcsAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  remittanceCharges: {
    type: Number,
    default: 0,
    min: 0
  },
  invoiceTotal: {
    type: Number,
    default: 0,
    min: 0
  },
  receivableAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    trim: true
  },
  subject: {
    type: String,
    trim: true
  },
  customerNotes: {
    type: String,
    trim: true
  },
  termsAndConditions: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const Quotation = mongoose.model('Quotation', quotationSchema);
export default Quotation;
