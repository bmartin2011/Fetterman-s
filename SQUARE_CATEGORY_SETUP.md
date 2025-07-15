# Square Category Setup Guide

This guide explains how to properly configure categories in Square Dashboard to take advantage of the hierarchical navigation system in Fetterman's menu.

## Category Hierarchy Overview

Square's Catalog API supports parent-child relationships through the `parent_category` field. Our application uses this to create an intuitive navigation experience:

- **Parent Categories**: Show in the main navigation bar with dropdown arrows
- **Subcategories**: Appear in dropdown menus under their parent categories
- **Standalone Categories**: Categories without subcategories show as direct navigation buttons

## Setting Up Categories in Square Dashboard

### Step 1: Create Parent Categories

1. Go to Square Dashboard → Items & Orders → Items
2. Click "Categories" tab
3. Create main categories (e.g., "Beverages", "Food", "Desserts")
4. Leave the "Parent Category" field empty for these

### Step 2: Create Subcategories

1. Create new categories for subcategories (e.g., "Soda", "Juices", "Coffee")
2. **Important**: Set the "Parent Category" field to the appropriate parent category
3. This creates the hierarchy: Beverages → Soda, Juices, Coffee

### Step 3: Assign Items to Categories

1. Edit your menu items
2. Assign items to the **subcategories** (not parent categories)
3. Example: Assign "Coca-Cola" to "Soda" category, not "Beverages"

## Example Category Structure

```
Beverages (Parent Category)
├── Soda (Subcategory)
│   ├── Coca-Cola
│   ├── Pepsi
│   └── Sprite
├── Juices (Subcategory)
│   ├── Orange Juice
│   ├── Apple Juice
│   └── Cranberry Juice
└── Coffee (Subcategory)
    ├── Espresso
    ├── Latte
    └── Cappuccino

Food (Parent Category)
├── Sandwiches (Subcategory)
├── Salads (Subcategory)
└── Soups (Subcategory)

Snacks (Standalone Category - no subcategories)
├── Chips
├── Cookies
└── Nuts
```

## Navigation Behavior

### Parent Categories with Subcategories
- Show in navigation bar with dropdown arrow
- Clicking shows dropdown with:
  - "All [Category Name]" option (shows all items in parent category)
  - Individual subcategory options

### Standalone Categories
- Show as direct navigation buttons (no dropdown arrow)
- Clicking scrolls directly to that category section

### Subcategories
- Only appear in dropdown menus
- Not shown in main navigation bar
- Clicking scrolls to that specific subcategory section

## Best Practices

1. **Logical Grouping**: Group related items under meaningful parent categories
2. **Balanced Hierarchy**: Aim for 3-7 subcategories per parent category
3. **Clear Naming**: Use descriptive names that customers will understand
4. **Consistent Assignment**: Always assign items to subcategories, not parent categories
5. **Regular Review**: Periodically review and reorganize as your menu evolves

## Common Pitfalls to Avoid

❌ **Don't**: Assign items directly to parent categories
✅ **Do**: Assign items to subcategories

❌ **Don't**: Create too many hierarchy levels (Square supports limited nesting)
✅ **Do**: Keep it simple with parent → subcategory structure

❌ **Don't**: Forget to set parent_category field for subcategories
✅ **Do**: Always set the parent relationship in Square Dashboard

❌ **Don't**: Create subcategories without a clear parent
✅ **Do**: Ensure every subcategory has a logical parent category

## Testing Your Setup

1. After setting up categories in Square Dashboard
2. Refresh your Fetterman's menu page
3. Check that:
   - Parent categories show with dropdown arrows
   - Standalone categories show without arrows
   - Dropdowns contain the correct subcategories
   - Items appear in the correct sections

## Troubleshooting

**Categories not showing hierarchy?**
- Verify parent_category is set correctly in Square Dashboard
- Check that categories are active/enabled
- Ensure items are assigned to subcategories

**Empty categories appearing?**
- Categories without items are automatically hidden
- Assign items to subcategories to make them visible

**Dropdown not working?**
- Ensure parent category has at least one subcategory
- Check that subcategories have items assigned

For technical support, refer to the development team or check the application logs for any API errors.