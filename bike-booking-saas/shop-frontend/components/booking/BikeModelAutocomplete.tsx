"use client";

import { Input } from "@/components/ui/input";

const MODELS = [
  "Honda Wave 110i",
  "Honda Click 160",
  "Honda PCX160",
  "Yamaha NMAX",
  "Yamaha Aerox",
  "Yamaha Grand Filano",
  "Kawasaki Ninja 400",
  "Kawasaki Z400",
  "GPX Demon",
  "Vespa Sprint"
];

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function BikeModelAutocomplete({ value, onChange }: Props) {
  return (
    <>
      <Input
        list="bike-models"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="เช่น Honda Click 160"
      />
      <datalist id="bike-models">
        {MODELS.map((model) => (
          <option key={model} value={model} />
        ))}
      </datalist>
    </>
  );
}
