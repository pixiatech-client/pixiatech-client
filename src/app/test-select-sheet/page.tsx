'use client';

import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function TestSelectSheet() {
  const [value, setValue] = useState('b');
  return (
    <main style={{ padding: 40 }}>
      <h1>Test select sheet</h1>
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger aria-label="Test select" className="w-64">
          <SelectValue placeholder="Choisir…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
          <SelectItem value="b">Option B</SelectItem>
          <SelectItem value="c" disabled>Option C</SelectItem>
          <SelectItem value="d">Option D</SelectItem>
          <SelectItem value="e">Option E</SelectItem>
          <SelectItem value="f">Option F</SelectItem>
          <SelectItem value="g">Option G</SelectItem>
          <SelectItem value="h">Option H</SelectItem>
          <SelectItem value="i">Option I</SelectItem>
        </SelectContent>
      </Select>
      <p data-testid="value">{value}</p>
    </main>
  );
}
