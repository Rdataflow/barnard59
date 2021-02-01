const template = require('../template')
const Issue = require('../issue')

const firstOperationIsReadable = {
  ruleId: 9,
  ruleDescription: 'If there exists more than one step, first step must be either Readable or ReadableObjectMode',
  messageSuccessTemplate: template`Validated operation ${'operation'}: first operation must be either Readable or ReadableObjectMode`,
  messageFailureTemplate: template`Invalid operation ${'operation'}: it is neither Readable nor ReadableObjectMode`,
  validate: (isReadableOrReadableObjectMode, step, operation) => {
    let issue
    if (!isReadableOrReadableObjectMode) {
      issue = Issue.error({
        id: firstOperationIsReadable.ruleId,
        message: firstOperationIsReadable.messageSuccessTemplate({ operation }),
        step,
        operation
      })
    }
    else {
      issue = Issue.info({
        id: firstOperationIsReadable.ruleId,
        message: firstOperationIsReadable.messageSuccessTemplate({ operation }),
        step,
        operation
      })
    }
    return issue
  },
  describeRule: () => {
    return {
      ruleId: firstOperationIsReadable.ruleId,
      ruleDescription: firstOperationIsReadable.ruleDescription,
      messageSuccess: firstOperationIsReadable.messageSuccessTemplate(),
      messageFailure: firstOperationIsReadable.messageFailureTemplate()
    }
  }
}
module.exports = firstOperationIsReadable
