# Third-Party Notices

This project incorporates third-party material. Detailed attributions follow.

## Upstream code

[pokegents](https://github.com/tRidha/pokegents) by Thariq Ridha. Licensed under MIT (inherited; see `LICENSE`).

## Fonts

**Upheaval TT BRK** by Brian Kent (AEnigma Fonts). Free for non-commercial use. Source: https://www.dafont.com/upheaval.font

## Sprite assets

Sprites are extracted from The Binding of Isaac: Rebirth and its expansions, sourced from the community-maintained TBOI wiki at https://bindingofisaacrebirth.wiki.gg/ and used under fan-project fair-use assumption. All sprites are (c) Edmund McMillen / Nicalis; this project is non-commercial.

The pipeline is defined in `sprite-sources/manifest.json` and run via `scripts/fetch-tboi-sprites.ts`. Each source PNG is downloaded from the wiki, upscaled to 96x96 with nearest-neighbor (preserving the pixel-art look), and committed under `dashboard/web/public/sprites/`.

| Slug | Name | Kind | Wiki Page |
|------|------|------|-----------|
| `isaac` | Isaac | character | [Isaac](https://bindingofisaacrebirth.wiki.gg/wiki/Isaac) |
| `magdalene` | Magdalene | character | [Magdalene](https://bindingofisaacrebirth.wiki.gg/wiki/Magdalene) |
| `cain` | Cain | character | [Cain](https://bindingofisaacrebirth.wiki.gg/wiki/Cain) |
| `judas` | Judas | character | [Judas](https://bindingofisaacrebirth.wiki.gg/wiki/Judas) |
| `blue-baby` | ??? | character | [???](https://bindingofisaacrebirth.wiki.gg/wiki/%3F%3F%3F_(Character)) |
| `eve` | Eve | character | [Eve](https://bindingofisaacrebirth.wiki.gg/wiki/Eve) |
| `samson` | Samson | character | [Samson](https://bindingofisaacrebirth.wiki.gg/wiki/Samson) |
| `azazel` | Azazel | character | [Azazel](https://bindingofisaacrebirth.wiki.gg/wiki/Azazel) |
| `lazarus` | Lazarus | character | [Lazarus](https://bindingofisaacrebirth.wiki.gg/wiki/Lazarus) |
| `eden` | Eden | character | [Eden](https://bindingofisaacrebirth.wiki.gg/wiki/Eden) |
| `the-lost` | The Lost | character | [The Lost](https://bindingofisaacrebirth.wiki.gg/wiki/The_Lost) |
| `lilith` | Lilith | character | [Lilith](https://bindingofisaacrebirth.wiki.gg/wiki/Lilith) |
| `keeper` | Keeper | character | [Keeper](https://bindingofisaacrebirth.wiki.gg/wiki/Keeper) |
| `apollyon` | Apollyon | character | [Apollyon](https://bindingofisaacrebirth.wiki.gg/wiki/Apollyon) |
| `the-forgotten` | The Forgotten | character | [The Forgotten](https://bindingofisaacrebirth.wiki.gg/wiki/The_Forgotten) |
| `bethany` | Bethany | character | [Bethany](https://bindingofisaacrebirth.wiki.gg/wiki/Bethany) |
| `jacob-and-esau` | Jacob & Esau | character | [Jacob & Esau](https://bindingofisaacrebirth.wiki.gg/wiki/Jacob_%26_Esau) |
| `tainted-isaac` | Tainted Isaac | tainted | [Tainted Isaac](https://bindingofisaacrebirth.wiki.gg/wiki/Tainted_Isaac) |
| `tainted-magdalene` | Tainted Magdalene | tainted | [Tainted Magdalene](https://bindingofisaacrebirth.wiki.gg/wiki/Tainted_Magdalene) |
| `tainted-cain` | Tainted Cain | tainted | [Tainted Cain](https://bindingofisaacrebirth.wiki.gg/wiki/Tainted_Cain) |
| `tainted-judas` | Tainted Judas | tainted | [Tainted Judas](https://bindingofisaacrebirth.wiki.gg/wiki/Tainted_Judas) |
| `tainted-blue-baby` | Tainted ??? | tainted | [Tainted ???](https://bindingofisaacrebirth.wiki.gg/wiki/Tainted_%3F%3F%3F) |
| `tainted-eve` | Tainted Eve | tainted | [Tainted Eve](https://bindingofisaacrebirth.wiki.gg/wiki/Tainted_Eve) |
| `tainted-samson` | Tainted Samson | tainted | [Tainted Samson](https://bindingofisaacrebirth.wiki.gg/wiki/Tainted_Samson) |
| `tainted-azazel` | Tainted Azazel | tainted | [Tainted Azazel](https://bindingofisaacrebirth.wiki.gg/wiki/Tainted_Azazel) |
| `tainted-lazarus` | Tainted Lazarus | tainted | [Tainted Lazarus](https://bindingofisaacrebirth.wiki.gg/wiki/Tainted_Lazarus) |
| `tainted-eden` | Tainted Eden | tainted | [Tainted Eden](https://bindingofisaacrebirth.wiki.gg/wiki/Tainted_Eden) |
| `tainted-lost` | Tainted Lost | tainted | [Tainted Lost](https://bindingofisaacrebirth.wiki.gg/wiki/Tainted_Lost) |
| `tainted-lilith` | Tainted Lilith | tainted | [Tainted Lilith](https://bindingofisaacrebirth.wiki.gg/wiki/Tainted_Lilith) |
| `tainted-keeper` | Tainted Keeper | tainted | [Tainted Keeper](https://bindingofisaacrebirth.wiki.gg/wiki/Tainted_Keeper) |
| `tainted-apollyon` | Tainted Apollyon | tainted | [Tainted Apollyon](https://bindingofisaacrebirth.wiki.gg/wiki/Tainted_Apollyon) |
| `tainted-forgotten` | Tainted Forgotten | tainted | [Tainted Forgotten](https://bindingofisaacrebirth.wiki.gg/wiki/Tainted_Forgotten) |
| `tainted-bethany` | Tainted Bethany | tainted | [Tainted Bethany](https://bindingofisaacrebirth.wiki.gg/wiki/Tainted_Bethany) |
| `tainted-jacob` | Tainted Jacob | tainted | [Tainted Jacob](https://bindingofisaacrebirth.wiki.gg/wiki/Tainted_Jacob) |
| `brother-bobby` | Brother Bobby | familiar | [Brother Bobby](https://bindingofisaacrebirth.wiki.gg/wiki/Brother_Bobby) |
| `sister-maggy` | Sister Maggy | familiar | [Sister Maggy](https://bindingofisaacrebirth.wiki.gg/wiki/Sister_Maggy) |
| `demon-baby` | Demon Baby | familiar | [Demon Baby](https://bindingofisaacrebirth.wiki.gg/wiki/Demon_Baby) |
| `lil-brimstone` | Lil Brimstone | familiar | [Lil Brimstone](https://bindingofisaacrebirth.wiki.gg/wiki/Lil_Brimstone) |
| `sworn-protector` | Sworn Protector | familiar | [Sworn Protector](https://bindingofisaacrebirth.wiki.gg/wiki/Sworn_Protector) |
| `holy-water` | Holy Water | familiar | [Holy Water](https://bindingofisaacrebirth.wiki.gg/wiki/Holy_Water) |
| `guardian-angel` | Guardian Angel | familiar | [Guardian Angel](https://bindingofisaacrebirth.wiki.gg/wiki/Guardian_Angel) |
| `seraphim` | Seraphim | familiar | [Seraphim](https://bindingofisaacrebirth.wiki.gg/wiki/Seraphim) |
| `ghost-baby` | Ghost Baby | familiar | [Ghost Baby](https://bindingofisaacrebirth.wiki.gg/wiki/Ghost_Baby) |
| `harlequin-baby` | Harlequin Baby | familiar | [Harlequin Baby](https://bindingofisaacrebirth.wiki.gg/wiki/Harlequin_Baby) |
| `robo-baby` | Robo-Baby | familiar | [Robo-Baby](https://bindingofisaacrebirth.wiki.gg/wiki/Robo-Baby) |
| `cube-baby` | Cube Baby | familiar | [Cube Baby](https://bindingofisaacrebirth.wiki.gg/wiki/Cube_Baby) |
| `distant-admiration` | Distant Admiration | familiar | [Distant Admiration](https://bindingofisaacrebirth.wiki.gg/wiki/Distant_Admiration) |
| `sacrificial-dagger` | Sacrificial Dagger | familiar | [Sacrificial Dagger](https://bindingofisaacrebirth.wiki.gg/wiki/Sacrificial_Dagger) |
| `punching-bag` | Punching Bag | familiar | [Punching Bag](https://bindingofisaacrebirth.wiki.gg/wiki/Punching_Bag) |
| `abel` | Abel | familiar | [Abel](https://bindingofisaacrebirth.wiki.gg/wiki/Abel) |
| `acid-baby` | Acid Baby | familiar | [Acid Baby](https://bindingofisaacrebirth.wiki.gg/wiki/Acid_Baby) |
| `bbf` | BBF | familiar | [BBF](https://bindingofisaacrebirth.wiki.gg/wiki/BBF) |
| `best-bud` | Best Bud | familiar | [Best Bud](https://bindingofisaacrebirth.wiki.gg/wiki/Best_Bud) |
| `big-chubby` | Big Chubby | familiar | [Big Chubby](https://bindingofisaacrebirth.wiki.gg/wiki/Big_Chubby) |
| `big-fan` | Big Fan | familiar | [Big Fan](https://bindingofisaacrebirth.wiki.gg/wiki/Big_Fan) |
| `bloodshot-eye` | Bloodshot Eye | familiar | [Bloodshot Eye](https://bindingofisaacrebirth.wiki.gg/wiki/Bloodshot_Eye) |
| `cube-of-meat` | Cube of Meat | familiar | [Cube of Meat](https://bindingofisaacrebirth.wiki.gg/wiki/Cube_of_Meat) |
| `daddy-longlegs` | Daddy Longlegs | familiar | [Daddy Longlegs](https://bindingofisaacrebirth.wiki.gg/wiki/Daddy_Longlegs) |
| `dark-bum` | Dark Bum | familiar | [Dark Bum](https://bindingofisaacrebirth.wiki.gg/wiki/Dark_Bum) |
| `dead-bird` | Dead Bird | familiar | [Dead Bird](https://bindingofisaacrebirth.wiki.gg/wiki/Dead_Bird) |
| `dead-cat` | Dead Cat | familiar | [Dead Cat](https://bindingofisaacrebirth.wiki.gg/wiki/Dead_Cat) |
| `dry-baby` | Dry Baby | familiar | [Dry Baby](https://bindingofisaacrebirth.wiki.gg/wiki/Dry_Baby) |
| `halo-of-flies` | Halo of Flies | familiar | [Halo of Flies](https://bindingofisaacrebirth.wiki.gg/wiki/Halo_of_Flies) |
| `headless-baby` | Headless Baby | familiar | [Headless Baby](https://bindingofisaacrebirth.wiki.gg/wiki/Headless_Baby) |
| `incubus` | Incubus | familiar | [Incubus](https://bindingofisaacrebirth.wiki.gg/wiki/Incubus) |
| `king-baby` | King Baby | familiar | [King Baby](https://bindingofisaacrebirth.wiki.gg/wiki/King_Baby) |
| `leech` | Leech | familiar | [Leech](https://bindingofisaacrebirth.wiki.gg/wiki/Leech) |
| `lil-abaddon` | Lil Abaddon | familiar | [Lil Abaddon](https://bindingofisaacrebirth.wiki.gg/wiki/Lil_Abaddon) |
| `lil-delirium` | Lil Delirium | familiar | [Lil Delirium](https://bindingofisaacrebirth.wiki.gg/wiki/Lil_Delirium) |
| `lil-haunt` | Lil Haunt | familiar | [Lil Haunt](https://bindingofisaacrebirth.wiki.gg/wiki/Lil_Haunt) |
| `lil-loki` | Lil Loki | familiar | [Lil Loki](https://bindingofisaacrebirth.wiki.gg/wiki/Lil_Loki) |
| `lil-monstro` | Lil Monstro | familiar | [Lil Monstro](https://bindingofisaacrebirth.wiki.gg/wiki/Lil_Monstro) |
| `little-steven` | Little Steven | familiar | [Little Steven](https://bindingofisaacrebirth.wiki.gg/wiki/Little_Steven) |
| `lost-soul` | Lost Soul | familiar | [Lost Soul](https://bindingofisaacrebirth.wiki.gg/wiki/Lost_Soul) |
| `papa-fly` | Papa Fly | familiar | [Papa Fly](https://bindingofisaacrebirth.wiki.gg/wiki/Papa_Fly) |
| `psy-fly` | Psy Fly | familiar | [Psy Fly](https://bindingofisaacrebirth.wiki.gg/wiki/Psy_Fly) |
| `rainbow-baby` | Rainbow Baby | familiar | [Rainbow Baby](https://bindingofisaacrebirth.wiki.gg/wiki/Rainbow_Baby) |
| `rotten-baby` | Rotten Baby | familiar | [Rotten Baby](https://bindingofisaacrebirth.wiki.gg/wiki/Rotten_Baby) |
| `sprinkler` | Sprinkler | familiar | [Sprinkler](https://bindingofisaacrebirth.wiki.gg/wiki/Sprinkler) |
| `succubus` | Succubus | familiar | [Succubus](https://bindingofisaacrebirth.wiki.gg/wiki/Succubus) |
| `vanishing-twin` | Vanishing Twin | familiar | [Vanishing Twin](https://bindingofisaacrebirth.wiki.gg/wiki/Vanishing_Twin) |
| `bumbo` | Bumbo | familiar | [Bumbo](https://bindingofisaacrebirth.wiki.gg/wiki/Bumbo) |
| `charged-baby` | Charged Baby | familiar | [Charged Baby](https://bindingofisaacrebirth.wiki.gg/wiki/Charged_Baby) |
| `robo-baby-2` | Robo-Baby 2.0 | familiar | [Robo-Baby 2.0](https://bindingofisaacrebirth.wiki.gg/wiki/Robo-Baby_2.0) |
