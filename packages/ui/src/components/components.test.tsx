import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PAIN_ANCHORS, painAnchor } from '@canker/core';

import { Badge, PAIN_LEVEL_CLASSES } from './badge';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Checkbox } from './checkbox';
import { Chip } from './chip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger
} from './dialog';
import { EmptyState } from './empty-state';
import { Input } from './input';
import { Label } from './label';
import { LevelSlider } from './level-slider';
import { PainDot } from './pain-dot';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { RadioGroup, RadioGroupItem } from './radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Separator } from './separator';
import { Skeleton } from './skeleton';
import { StatTile } from './stat-tile';
import { Switch } from './switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Textarea } from './textarea';

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

describe('Button', () => {
  it.each(['default', 'secondary', 'outline', 'ghost', 'destructive', 'heal'] as const)(
    'renders the %s variant as a real button',
    (variant) => {
      render(<Button variant={variant}>Save</Button>);
      const btn = screen.getByRole('button', { name: 'Save' });
      expect(btn.tagName).toBe('BUTTON');
      expect(btn).toHaveAttribute('type', 'button');
      expect(btn).toHaveAttribute('data-slot', 'button');
    }
  );

  it.each(['default', 'sm', 'lg', 'icon'] as const)('renders the %s size', (size) => {
    render(<Button size={size}>Go</Button>);
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument();
  });

  it('renders the child element instead of a button when asChild', () => {
    render(
      <Button asChild variant="outline">
        <a href="/log">Log a sore</a>
      </Button>
    );
    const link = screen.getByRole('link', { name: 'Log a sore' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/log');
    expect(link).toHaveAttribute('data-slot', 'button');
    // and no implicit type="button" is leaked onto the anchor
    expect(link).not.toHaveAttribute('type');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('fires onClick and respects disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Tap</Button>);
    await user.click(screen.getByRole('button', { name: 'Tap' }));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(
      <Button onClick={onClick} disabled>
        Tap
      </Button>
    );
    await user.click(screen.getByRole('button', { name: 'Tap' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Chip
// ---------------------------------------------------------------------------

function ControlledChip({ onToggle }: { onToggle: (next: boolean) => void }) {
  const [selected, setSelected] = React.useState(false);
  return (
    <Chip
      selected={selected}
      onToggle={(next) => {
        onToggle(next);
        setSelected(next);
      }}
    >
      Stress
    </Chip>
  );
}

describe('Chip', () => {
  it('toggles aria-pressed and reports the flipped value', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<ControlledChip onToggle={onToggle} />);

    const chip = screen.getByRole('button', { name: 'Stress' });
    expect(chip).toHaveAttribute('type', 'button');
    expect(chip).toHaveAttribute('aria-pressed', 'false');
    expect(chip).not.toHaveAttribute('data-selected');

    await user.click(chip);
    expect(onToggle).toHaveBeenNthCalledWith(1, true);
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    expect(chip).toHaveAttribute('data-selected', 'true');

    await user.click(chip);
    expect(onToggle).toHaveBeenNthCalledWith(2, false);
    expect(chip).toHaveAttribute('aria-pressed', 'false');
  });

  it('does not toggle when the click handler prevents default', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <Chip onToggle={onToggle} onClick={(e) => e.preventDefault()}>
        Blocked
      </Chip>
    );
    await user.click(screen.getByRole('button', { name: 'Blocked' }));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('renders the add variant', () => {
    render(<Chip variant="add">Add trigger</Chip>);
    expect(screen.getByRole('button', { name: 'Add trigger' })).toHaveClass(
      'border-dashed'
    );
  });
});

// ---------------------------------------------------------------------------
// LevelSlider
// ---------------------------------------------------------------------------

describe('LevelSlider', () => {
  it('renders the value, the matching anchor and an accessible slider', () => {
    render(
      <LevelSlider
        label="Pain"
        value={6}
        min={0}
        max={10}
        anchors={PAIN_ANCHORS}
        onChange={() => {}}
      />
    );

    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText(painAnchor(6))).toBeInTheDocument();
    expect(screen.getByText('Hurts when talking')).toBeInTheDocument();

    const slider = screen.getByRole('slider', { name: 'Pain' });
    expect(slider).toHaveAttribute('aria-valuenow', '6');
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '10');
    expect(slider).toHaveAttribute('aria-valuetext', '6, Hurts when talking');

    expect(screen.getByRole('group', { name: 'Pain' })).toBeInTheDocument();
  });

  it('shows the lowest anchor at the bottom of the range', () => {
    render(
      <LevelSlider
        label="Pain"
        value={0}
        min={0}
        max={10}
        anchors={PAIN_ANCHORS}
        onChange={() => {}}
      />
    );
    expect(screen.getByRole('slider', { name: 'Pain' })).toHaveAttribute(
      'aria-valuetext',
      '0, No pain'
    );
  });

  it('formats the readout and the range ends', () => {
    render(
      <LevelSlider
        label="Size"
        value={5}
        min={1}
        max={30}
        format={(v) => `${v} mm`}
        onChange={() => {}}
      />
    );
    expect(screen.getByText('5 mm')).toBeInTheDocument();
    expect(screen.getByText('1 mm')).toBeInTheDocument();
    expect(screen.getByText('30 mm')).toBeInTheDocument();
  });

  it('reports keyboard changes through onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LevelSlider label="Pain" value={4} min={0} max={10} onChange={onChange} />);
    const slider = screen.getByRole('slider', { name: 'Pain' });
    slider.focus();
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith(5);
  });
});

// ---------------------------------------------------------------------------
// Badge / PainDot
// ---------------------------------------------------------------------------

describe('Badge', () => {
  it('applies the pain ramp class for the given level', () => {
    render(
      <Badge variant="pain" level={3}>
        Pain 5
      </Badge>
    );
    const badge = screen.getByText('Pain 5');
    expect(badge).toHaveClass('bg-pain-3');
    expect(badge).toHaveClass('text-pain-3-foreground');
    expect(badge).toHaveAttribute('data-level', '3');
    expect(badge).toHaveAttribute('data-slot', 'badge');
  });

  it.each([1, 2, 3, 4, 5] as const)('covers pain level %i', (level) => {
    render(
      <Badge variant="pain" level={level}>
        {`level-${level}`}
      </Badge>
    );
    expect(screen.getByText(`level-${level}`)).toHaveClass(
      ...PAIN_LEVEL_CLASSES[level].split(' ')
    );
  });

  it.each(['default', 'secondary', 'outline', 'heal', 'warn'] as const)(
    'renders the %s variant',
    (variant) => {
      render(<Badge variant={variant}>{variant}</Badge>);
      expect(screen.getByText(variant)).toBeInTheDocument();
    }
  );

  it('renders the child element when asChild', () => {
    render(
      <Badge asChild>
        <a href="/tags/stress">stress</a>
      </Badge>
    );
    expect(screen.getByRole('link', { name: 'stress' }).tagName).toBe('A');
  });
});

describe('PainDot', () => {
  it('uses the heal colour and label when healed', () => {
    render(<PainDot pain={9} healed />);
    const dot = screen.getByRole('img', { name: 'Healed' });
    expect(dot).toHaveClass('bg-heal');
    expect(dot).not.toHaveClass('bg-pain-5');
  });

  it.each([
    [0, 'bg-pain-1'],
    [3, 'bg-pain-2'],
    [5, 'bg-pain-3'],
    [7, 'bg-pain-4'],
    [10, 'bg-pain-5']
  ] as const)('maps pain %i to %s', (pain, expected) => {
    render(<PainDot pain={pain} />);
    expect(screen.getByRole('img', { name: `Pain ${pain} of 10` })).toHaveClass(expected);
  });
});

// ---------------------------------------------------------------------------
// EmptyState / StatTile / Card
// ---------------------------------------------------------------------------

describe('EmptyState', () => {
  it('renders the title, body and action', () => {
    render(
      <EmptyState
        icon={<svg data-testid="icon" />}
        title="No sores yet"
        body="Log one when something turns up."
        action={<Button>Log a sore</Button>}
      />
    );
    expect(screen.getByRole('heading', { name: 'No sores yet' })).toBeInTheDocument();
    expect(screen.getByText('Log one when something turns up.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log a sore' })).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders with only a title', () => {
    render(<EmptyState title="Nothing here" />);
    expect(screen.getByRole('heading', { name: 'Nothing here' })).toBeInTheDocument();
  });
});

describe('StatTile', () => {
  it('renders the value, label and hint', () => {
    render(<StatTile value="12" label="Days tracked" hint="since March" />);
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Days tracked')).toBeInTheDocument();
    expect(screen.getByText('since March')).toBeInTheDocument();
  });

  it('renders a zero hint rather than hiding it', () => {
    render(<StatTile value={0} label="Open sores" hint={0} />);
    expect(screen.getAllByText('0')).toHaveLength(2);
  });
});

describe('Card', () => {
  it('renders its parts', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Today</CardTitle>
          <CardDescription>How things are</CardDescription>
        </CardHeader>
        <CardContent>Two open sores</CardContent>
      </Card>
    );
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('How things are')).toBeInTheDocument();
    expect(screen.getByText('Two open sores')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Dialog
// ---------------------------------------------------------------------------

describe('Dialog', () => {
  it('renders a sheet with its title when open', () => {
    render(
      <Dialog open>
        <DialogContent sheet>
          <DialogTitle>Log a sore</DialogTitle>
          <DialogDescription>Where does it hurt?</DialogDescription>
        </DialogContent>
      </Dialog>
    );
    const dialog = screen.getByRole('dialog', { name: 'Log a sore' });
    expect(dialog).toHaveAttribute('data-sheet', 'true');
    expect(screen.getByText('Where does it hurt?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('renders a centred dialog without the close button when asked', () => {
    render(
      <Dialog open>
        <DialogContent showCloseButton={false}>
          <DialogTitle>Delete sore</DialogTitle>
          <DialogDescription>This cannot be undone.</DialogDescription>
        </DialogContent>
      </Dialog>
    );
    const dialog = screen.getByRole('dialog', { name: 'Delete sore' });
    expect(dialog).not.toHaveAttribute('data-sheet');
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });

  it('opens from its trigger', async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open</Button>
        </DialogTrigger>
        <DialogContent sheet>
          <DialogTitle>Log a sore</DialogTitle>
          <DialogDescription>Where does it hurt?</DialogDescription>
        </DialogContent>
      </Dialog>
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByRole('dialog', { name: 'Log a sore' })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Form primitives smoke tests
// ---------------------------------------------------------------------------

describe('form primitives', () => {
  it('associates a Label with an Input', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Label htmlFor="note">Note</Label>
        <Input id="note" />
      </>
    );
    const input = screen.getByLabelText('Note');
    await user.type(input, 'sore hurts');
    expect(input).toHaveValue('sore hurts');
  });

  it('types into a Textarea', async () => {
    const user = userEvent.setup();
    render(<Textarea aria-label="Notes" />);
    await user.type(screen.getByLabelText('Notes'), 'hello');
    expect(screen.getByLabelText('Notes')).toHaveValue('hello');
  });

  it('toggles a Checkbox', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Checkbox aria-label="Healed" onCheckedChange={onCheckedChange} />);
    await user.click(screen.getByRole('checkbox', { name: 'Healed' }));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('toggles a Switch', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="Reminders" onCheckedChange={onCheckedChange} />);
    await user.click(screen.getByRole('switch', { name: 'Reminders' }));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('renders a Separator, a Skeleton and switches Tabs', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Separator />
        <Skeleton className="h-4 w-10" />
        <Tabs defaultValue="map">
          <TabsList>
            <TabsTrigger value="map">Map</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>
          <TabsContent value="map">Map panel</TabsContent>
          <TabsContent value="list">List panel</TabsContent>
        </Tabs>
      </>
    );
    expect(screen.getByText('Map panel')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'List' }));
    expect(screen.getByText('List panel')).toBeInTheDocument();
    expect(screen.queryByText('Map panel')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Overlay primitives
//
// Radix's popper-backed overlays (Popover, Select) need real layout to *open*
// via a pointer, which jsdom cannot provide cheaply or reliably. They are driven
// through their controlled `open` prop instead: the point of these tests is that
// the content mounts and is reachable, not that Radix's own trigger logic works.
// ---------------------------------------------------------------------------

describe('Popover', () => {
  it('renders its content when open', () => {
    render(
      <Popover open>
        <PopoverTrigger asChild>
          <Button>Why?</Button>
        </PopoverTrigger>
        <PopoverContent>Because it has been open 14 days.</PopoverContent>
      </Popover>
    );
    expect(screen.getByRole('button', { name: 'Why?' })).toBeInTheDocument();
    const content = screen.getByText('Because it has been open 14 days.');
    expect(content).toHaveAttribute('data-slot', 'popover-content');
  });

  it('renders nothing but the trigger when closed', () => {
    render(
      <Popover>
        <PopoverTrigger asChild>
          <Button>Why?</Button>
        </PopoverTrigger>
        <PopoverContent>Hidden</PopoverContent>
      </Popover>
    );
    expect(screen.queryByText('Hidden')).toBeNull();
  });
});

describe('RadioGroup', () => {
  it('selects an option', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <RadioGroup onValueChange={onValueChange}>
        <Label>
          <RadioGroupItem value="cheek_left" /> Left cheek
        </Label>
        <Label>
          <RadioGroupItem value="cheek_right" /> Right cheek
        </Label>
      </RadioGroup>
    );
    expect(screen.getAllByRole('radio')).toHaveLength(2);
    await user.click(screen.getByRole('radio', { name: 'Right cheek' }));
    expect(onValueChange).toHaveBeenCalledWith('cheek_right');
  });
});

describe('Select', () => {
  it('renders a trigger showing the placeholder', () => {
    render(
      <Select>
        <SelectTrigger aria-label="Surface">
          <SelectValue placeholder="Pick a surface" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="cheek_left">Left cheek</SelectItem>
          <SelectItem value="gum_upper">Upper gum</SelectItem>
        </SelectContent>
      </Select>
    );
    const trigger = screen.getByRole('combobox', { name: 'Surface' });
    expect(trigger).toHaveAttribute('data-size', 'default');
    expect(trigger).toHaveAttribute('data-placeholder');
    expect(screen.getByText('Pick a surface')).toBeInTheDocument();
  });

  it('shows the selected item label and its options when open', () => {
    render(
      <Select open value="gum_upper">
        <SelectTrigger aria-label="Surface">
          <SelectValue placeholder="Pick a surface" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="cheek_left">Left cheek</SelectItem>
          <SelectItem value="gum_upper">Upper gum</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getAllByRole('option')).toHaveLength(2);
    expect(screen.getByRole('option', { name: 'Upper gum' })).toHaveAttribute(
      'data-state',
      'checked'
    );
  });

  it('honours the small trigger size', () => {
    render(
      <Select>
        <SelectTrigger size="sm" aria-label="Range">
          <SelectValue placeholder="30 days" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="30">30 days</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByRole('combobox', { name: 'Range' })).toHaveAttribute(
      'data-size',
      'sm'
    );
  });
});
