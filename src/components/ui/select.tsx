"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  BottomSheetOptionRows,
  MobileBottomSheet,
  useIsMobile,
  type BottomSheetOption,
} from "@/components/ui/bottom-sheet"

/* -------------------------------------------------------------------------- */
/*          Select : desktop Radix intact, mobile = Bottom Sheet unique        */
/* -------------------------------------------------------------------------- */

type SelectRootProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>

function nodeToText(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(nodeToText).join("")
  if (React.isValidElement(node)) return nodeToText((node.props as { children?: React.ReactNode }).children)
  return ""
}

function isContent(child: React.ReactElement): boolean {
  return child.type === SelectContent || child.type === SelectPrimitive.Content
}

function isValue(child: React.ReactElement): boolean {
  return child.type === SelectValue || child.type === SelectPrimitive.Value
}

function isItem(child: React.ReactElement): boolean {
  return child.type === SelectItem || child.type === SelectPrimitive.Item
}

function collectOptions(nodes: React.ReactNode, out: BottomSheetOption[] = []): BottomSheetOption[] {
  React.Children.forEach(nodes, (child) => {
    if (!React.isValidElement(child)) return
    const props = child.props as {
      value?: string
      children?: React.ReactNode
      disabled?: boolean
      placeholder?: string
    }
    if (isItem(child) && props.value !== undefined) {
      out.push({
        value: String(props.value),
        label: props.children,
        searchText: nodeToText(props.children),
        disabled: props.disabled,
      })
      return
    }
    if (props.children) collectOptions(props.children, out)
  })
  return out
}

function findPlaceholder(nodes: React.ReactNode, fallback = "Sélectionner…"): string {
  let found = ""
  const walk = (children: React.ReactNode) => {
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child) || found) return
      const props = child.props as { children?: React.ReactNode; placeholder?: string }
      if (isValue(child) && props.placeholder) {
        found = props.placeholder
        return
      }
      if (props.children) walk(props.children)
    })
  }
  walk(nodes)
  return found || fallback
}

function prepareMobileChildren(nodes: React.ReactNode, label: string): React.ReactNode {
  return React.Children.map(nodes, (child) => {
    if (!React.isValidElement(child)) return child
    if (isContent(child)) return null
    const props = child.props as { children?: React.ReactNode }
    if (isValue(child)) {
      return React.cloneElement(child as React.ReactElement<{ children?: React.ReactNode }>, {
        children: label,
      })
    }
    if (props.children) {
      return React.cloneElement(child as React.ReactElement<{ children?: React.ReactNode }>, {
        children: prepareMobileChildren(props.children, label),
      })
    }
    return child
  })
}

function Select({
  children,
  value,
  defaultValue,
  onValueChange,
  onOpenChange,
  ...rest
}: SelectRootProps) {
  const isMobile = useIsMobile()
  const [internalValue, setInternalValue] = React.useState<string | undefined>(defaultValue ?? value ?? "")
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  const currentValue = value !== undefined ? value : internalValue ?? ""
  const options = React.useMemo(() => collectOptions(children), [children])
  const selected = options.find((option) => option.value === currentValue)
  const selectedLabel = selected ? nodeToText(selected.label) : ""
  const placeholder = findPlaceholder(children)
  const disabled = Boolean((rest as { disabled?: boolean }).disabled)

  // Desktop : comportement Radix strictement inchangé.
  if (!isMobile) {
    return (
      <SelectPrimitive.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        onOpenChange={onOpenChange}
        {...rest}
      >
        {children}
      </SelectPrimitive.Root>
    )
  }

  const close = () => {
    setSheetOpen(false)
    onOpenChange?.(false)
  }

  const handleChange = (next: string) => {
    if (value === undefined) setInternalValue(next)
    onValueChange?.(next)
    close()
  }

  const filtered = query.trim()
    ? options.filter((option) =>
        (option.searchText ?? "").toLowerCase().includes(query.trim().toLowerCase()),
      )
    : options

  return (
    <>
      <SelectPrimitive.Root
        {...rest}
        value={currentValue}
        onValueChange={handleChange}
        onOpenChange={(next) => {
          if (next && !disabled) {
            setQuery("")
            setSheetOpen(true)
            onOpenChange?.(true)
          } else if (!next) {
            onOpenChange?.(false)
          }
        }}
      >
        {prepareMobileChildren(children, selectedLabel)}
      </SelectPrimitive.Root>

      {typeof rest.name === "string" && (
        <select
          name={rest.name}
          value={currentValue}
          onChange={() => {}}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {nodeToText(option.label)}
            </option>
          ))}
        </select>
      )}

      <MobileBottomSheet
        open={sheetOpen}
        onClose={close}
        title={placeholder}
        tone="light"
      >
        {options.length > 8 && (
          <div className="relative mb-3">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50"
              aria-hidden="true"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher…"
              aria-label="Rechercher une option"
              autoComplete="off"
              className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-3 text-sm outline-none placeholder:text-gray-400"
            />
          </div>
        )}
        <BottomSheetOptionRows
          options={filtered}
          selected={[currentValue]}
          multiple={false}
          onToggle={handleChange}
          tone="light"
        />
      </MobileBottomSheet>
    </>
  )
}

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "w-full"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
