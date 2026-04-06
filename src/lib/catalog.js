import { db } from '@/lib/db';

export async function getCatalogTableConfig() {
  const [variantTables] = await db.query("SHOW TABLES LIKE 'product_variants'");
  const hasProductVariants = variantTables.length > 0;

  const [imageSortColumns] = await db.query("SHOW COLUMNS FROM product_images LIKE 'sort_order'");
  const imageSortColumn = imageSortColumns.length > 0 ? 'sort_order' : 'display_order';

  return {
    stockTable: hasProductVariants ? 'product_variants' : 'product_stock',
    stockQtyColumn: hasProductVariants ? 'stock_qty' : 'quantity',
    imageSortColumn,
  };
}
