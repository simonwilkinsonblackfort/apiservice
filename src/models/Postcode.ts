import mongoose, { Schema, Document } from 'mongoose'

export interface IAcceptablePostCode extends Document {
  postcode: string
  state?: string
  location?: string
  associatedSUA?: string
  ifApartments?: string
}

export interface IConstructionPostCode extends Document {
  postcode: string
  activeRetired?: string
  lmiLocation?: string
  ratingsLocation?: string
  riskLocation?: string
  geographicRegion?: string
}

const AcceptablePostCodeSchema = new Schema<IAcceptablePostCode>({
  postcode: { type: String, required: true },
  state: String,
  location: String,
  associatedSUA: String,
  ifApartments: String,
})
AcceptablePostCodeSchema.index({ postcode: 1 })

const ConstructionPostCodeSchema = new Schema<IConstructionPostCode>({
  postcode: { type: String, required: true },
  activeRetired: String,
  lmiLocation: String,
  ratingsLocation: String,
  riskLocation: String,
  geographicRegion: String,
})
ConstructionPostCodeSchema.index({ postcode: 1 })

export const AcceptablePostCode = mongoose.model<IAcceptablePostCode>('AcceptablePostCode', AcceptablePostCodeSchema)
export const ConstructionPostCode = mongoose.model<IConstructionPostCode>('ConstructionPostCode', ConstructionPostCodeSchema)
