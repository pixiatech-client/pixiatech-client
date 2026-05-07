"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
    items: { value: string; label: string }[];
    value?: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    disabled?: boolean;
    onEmptyResultClick?: (searchQuery: string) => void;
    emptyResultLabel?: React.ReactNode;
}

export function Combobox({ 
    items, 
    value, 
    onValueChange,
    placeholder, 
    searchPlaceholder,
    disabled = false,
    onEmptyResultClick,
    emptyResultLabel,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const handleSelect = (currentValue: string) => {
    onValueChange(currentValue === value ? "" : currentValue);
    setOpen(false);
  };
  
  const handleEmptyClick = () => {
    if (onEmptyResultClick) {
      onEmptyResultClick(searchQuery);
      setOpen(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <span className="truncate">
          {value
            ? items.find((item) => item.value === value)?.label
            : placeholder || "Select item..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[--radix-popover-trigger-width] p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandInput 
            placeholder={searchPlaceholder || "Search item..."}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
           <CommandList>
            <CommandEmpty>
                {onEmptyResultClick && emptyResultLabel ? (
                    <div onClick={handleEmptyClick} className="cursor-pointer p-4 text-sm text-center text-muted-foreground hover:bg-accent">
                        {emptyResultLabel}
                    </div>
                ) : (
                    "Aucun résultat."
                )}
            </CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label} // Filter by label
                  onSelect={() => handleSelect(item.value)}
                  className="flex justify-between items-center group"
                >
                  <div className="flex items-center">
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === item.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {item.label}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
