import { Document, Schema, Types, model } from "mongoose";

export interface IPlan extends Document<Types.ObjectId> {
  name: string;
  plotWidth: number;
  plotLength: number;
  plotMeasureUnit: string;
  layout: {
    nodes: {
      name: string;
      typeId: number;
    }[];
    edges: [number, number][];
  };
  settings: {
    unit: string;
    enableWallMeasure: boolean;
    enableRoomLabels: boolean;
  };
}

const PlanSchema = new Schema<IPlan>(
  {
    name: { type: String, required: true },
    plotWidth: { type: Number, required: true },
    plotLength: { type: Number, required: true },
    plotMeasureUnit: { type: String, required: true },
    layout: {
      nodes: [
        {
          label: String,
          typeId: Number,
          position: {
            x: Number,
            y: Number
          }
        }
      ],
      edges: [[Number, Number]]
    },
    settings: {
      unit: { type: String, required: true },
      enableWallMeasure: { type: Boolean, required: true, default: true },
      enableRoomLabels: { type: Boolean, required: true, default: true }
    }
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  }
);

PlanSchema.virtual("canvas", {
  ref: "PlanCanvas",
  localField: "_id",
  foreignField: "planId",
  justOne: true
});

export const Plan = model<IPlan>("Plan", PlanSchema);

export interface IPlanCanvas extends Document<Types.ObjectId> {
  planId: Types.ObjectId;
  canvasData: {
    shape: any;
    scale: any;
    rooms: any;
    walls: any;
    doors: any;
  };
}

const PlanCanvasSchema = new Schema<IPlanCanvas>(
  {
    planId: { type: Schema.Types.ObjectId, ref: "Plan", required: true },
    canvasData: {
      shape: Schema.Types.Mixed,
      scale: Schema.Types.Mixed,
      rooms: Schema.Types.Mixed,
      walls: Schema.Types.Mixed,
      doors: Schema.Types.Mixed
    }
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  }
);

export const PlanCanvas = model<IPlanCanvas>("PlanCanvas", PlanCanvasSchema);
