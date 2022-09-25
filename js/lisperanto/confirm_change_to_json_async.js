﻿// Version hash: d8551bd1acb3cc7a391d60f1a3c02dfc4b1d695d2320b72d922bcc02eae7af6b
if(typeof(lisperanto) === 'undefined')
{
	lisperanto = {};
}

lisperanto.confirm_change_to_json_async = async function(parent)
{
    event.stopPropagation();
    var obj = parent.wrapped_one();
    const updated_key = parent["key_with_changes@lisperanto"]();
    const new_value = parent["new_value@lisperanto"]();
    const copy = await lisperanto.copy_json_and_add_key_and_value_async(obj, updated_key, new_value);
    parent.wrapped_one(copy);
    var operation = {
        operation: "change_value_of_json_key",
        id_from: await lisperanto.calculate_hash_promise(obj),
        id_to: await lisperanto.calculate_hash_promise(copy),
        updated_key: updated_key,
        new_value: new_value,
        time: lisperanto.getCurrentDateTimeString()
    };
    await lisperanto.operationsPush_async(operation);
    parent["key_with_changes@lisperanto"]("");
    parent["new_value@lisperanto"]("")
};