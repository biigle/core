<?php

namespace Biigle\Modules\Sync\Console\Commands;

use Biigle\User;
use File;
use Hash;
use Illuminate\Console\Command;

class Uuids extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sync:uuids
        {file? : If a file is provided, use it for syncing. If not, output the contents of such a file.}
        {--dry-run : Do not change the database records}
        {--force : Synchronise matching users without asking}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Synchronize user UUIDs across BIIGLE instances';

    /**
     * Execute the command.
     *
     * @return void
     */
    public function handle()
    {
        if ($this->argument('file')) {
            $this->handleSync();
        } else {
            $this->generateOutput();
        }
    }

    /**
     * Read the input file and perform interactive synchronization of user UUIDs.
     */
    protected function handleSync()
    {
        $matches = 0;
        $input = collect(json_decode(File::get($this->argument('file')), true));
        $inputUuids = $input->pluck('uuid');

        // All users with a UUID not among those of the input are candidates for syncing.
        $users = User::select('id', 'email', 'firstname', 'lastname')
            ->whereNotIn('uuid', $inputUuids)
            ->get();

        // Remove input users with a UUID already in the database as they should not be
        // considered for syncing.
        $input = $input->whereNotIn('uuid', User::whereIn('uuid', $inputUuids)->pluck('uuid'));

        // Find matches and sync.
        foreach ($users as $user) {
            foreach ($input as $inputUser) {
                $emailMatches = Hash::check($user->email, $inputUser['email']);
                $nameMatches = Hash::check($user->firstname, $inputUser['firstname']) && Hash::check($user->lastname, $inputUser['lastname']);

                if ($emailMatches || $nameMatches) {
                    $matches += 1;
                }

                $sync = false;
                if ($emailMatches && $nameMatches) {
                    $this->info("Found matching email address and name for {$user->firstname} {$user->lastname} ({$user->email}).");
                    $sync = $this->option('force') || $this->confirm("Synchronize UUID with file?");
                } elseif ($emailMatches) {
                    $this->info("Found matching email address but different name for {$user->firstname} {$user->lastname} ({$user->email}).");
                    $sync = $this->option('force') || $this->confirm("Synchronize UUID with file?");
                } elseif ($nameMatches) {
                    $this->info("Found matching name but different email address for {$user->firstname} {$user->lastname} ({$user->email}).");
                    $sync = $this->option('force') || $this->confirm("Synchronize UUID with file?");
                }

                if ($sync) {
                    $user->uuid = $inputUser['uuid'];
                    if (!$this->option('dry-run')) {
                        $user->save();
                    }
                    $this->warn("UUID synchronized for {$user->firstname} {$user->lastname} ({$user->email}).");
                    break;
                }
            }
        }

        if ($matches === 0) {
            $this->info('No candidates found');
        } else {
            $this->info('Finished');
        }
    }

    /**
     * Generate the output that can be used as file to synchronize user UUIDs.
     */
    protected function generateOutput()
    {
        $users = User::select('uuid', 'firstname', 'lastname', 'email')->get();
        $bar = $this->output->createProgressBar($users->count());
        $users = $users->map(function ($user) use ($bar) {
                $bar->advance();

                return [
                    'uuid' => $user->uuid,
                    'firstname' => Hash::make($user->firstname),
                    'lastname' => Hash::make($user->lastname),
                    'email' => Hash::make($user->email),
                ];
            })
            ->toJson(JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $bar->finish();

        echo $users;
    }
}
