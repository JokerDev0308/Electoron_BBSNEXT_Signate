import CreateTableSettings1610443829903 from '../migrations/1610443829903-CreateTableSettings';
import CreateTableAttachment1612833020872 from '../migrations/1612833020872-CreateTableAttachment';
import CreateTableMessage1612833030267 from '../migrations/1612833030267-CreateTableMessage';
import UpdateDeliveryJson1616553058049 from '../migrations/1616553058049-UpdateDeliveryJson';
import CreateTableReplyText1617587938323 from '../migrations/1617587938323-CreateTableReplyText';
import AddReplyNumberToMessage1712194579048 from '../migrations/1712194579048-AddReplyNumberToMessage';

const migrations = [
  // import all migration classes here
  CreateTableSettings1610443829903,
  CreateTableAttachment1612833020872,
  CreateTableMessage1612833030267,
  UpdateDeliveryJson1616553058049,
  CreateTableReplyText1617587938323,
  AddReplyNumberToMessage1712194579048
];

export default migrations;
