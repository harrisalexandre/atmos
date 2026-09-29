export type FlightCondition="VFR"|"MVFR"|"IFR"|"LIFR"|"UNKNOWN";
export type MessageType="METAR"|"TAF"|"AVISO"|"SIGMET";
export interface Aerodrome{icao:string;name:string;city:string|null;role:"principal"|"apoio";latitude:number;longitude:number;distance_km:number|null;enabled:boolean}
export interface RedemetMessage{id:string;type:MessageType;locality:string;raw:string;decoded:Record<string,unknown>;observed_at:string;fetched_at:string;valid_until:string|null}
export interface RadarFrame{id:string;area:string;type:string;frame_url:string;frame_timestamp:string;fetched_at:string}
export interface StationSnapshot{aerodrome:Aerodrome;metar:RedemetMessage|null;taf:RedemetMessage|null;condition:FlightCondition}
