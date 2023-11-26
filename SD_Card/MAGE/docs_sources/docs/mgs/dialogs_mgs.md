# Dialogs (MGS)

The [dialog](dialogs) structure for [MGS Natlang](mgs/mgs_natlang), found within [dialog blocks](mgs/dialog_block) (and related [combination blocks](mgs/combination_block)). (For the JSON equivalent, see: [Dialogs (JSON)](dialogs/dialogs_json))

## Structure

1. [Dialog identifier](mgs/dialog_identifier): exactly 1
2. [Dialog parameter](mgs/dialog_parameters_mgs): 0+
3. [Dialog message](mgs/dialog_messages_mgs): 1+
4. [Dialog option](mgs/dialog_options_mgs): 0-4x

Multiple dialogs can occur back-to-back inside their parent block.
