<?php

namespace Biigle\Tests;

use Biigle\MediaType;
use Biigle\ReportType;
use Biigle\Role;
use Biigle\Shape;
use Biigle\Visibility;
use DB;
use PHPUnit\Framework\Attributes\DataProvider;
use TestCase;

/**
 * Columns referencing enum values have a check constraint that restricts them to the
 * range of the enum values (see EnumMigrationHelper). The constraints are not updated
 * automatically when an enum case is added, so this test fails until a migration
 * updates the respective constraints.
 */
class EnumRangeConstraintTest extends TestCase
{
    public static function constraintProvider(): array
    {
        return [
            ['users', 'role', Role::class],
            ['project_user', 'project_role', Role::class],
            ['label_tree_user', 'role', Role::class],
            ['project_invitations', 'role', Role::class],
            ['volumes', 'media_type', MediaType::class],
            ['pending_volumes', 'media_type', MediaType::class],
            ['image_annotations', 'shape', Shape::class],
            ['video_annotations', 'shape', Shape::class],
            ['label_trees', 'visibility', Visibility::class],
            ['reports', 'type', ReportType::class],
        ];
    }

    #[DataProvider('constraintProvider')]
    public function testRangeConstraintMatchesEnum(string $table, string $column, string $enum): void
    {
        $constraint = DB::selectOne(
            'SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conname = ?',
            ["{$table}_{$column}_check"]
        );
        $this->assertNotNull($constraint, "Constraint {$table}_{$column}_check does not exist.");

        // Postgres stores "x BETWEEN a AND b" as "((x >= a) AND (x <= b))".
        preg_match_all('/\d+/', $constraint->def, $matches);
        $bounds = array_map('intval', $matches[0]);
        $values = array_column($enum::cases(), 'value');

        $this->assertSame([min($values), max($values)], $bounds);
    }
}
