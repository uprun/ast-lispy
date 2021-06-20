﻿var lookup = {};
lookup.customObjects = {};
lookup.functionsArray = ko.observableArray([]);
lookup.functionsLookup = ko.computed(function()
{
    return ko.utils.arrayMap(lookup.functionsArray(), function(item) {
        var parameters_names_list = ko.utils.arrayMap(lookup.customObjects[item.id].parameters(), function(item)
        {
            return lookup.customObjects[item].parameterName;
        });
        return { id: item.id, 
            text: lookup.customObjects[item.id].name() + '(' + parameters_names_list.join(", ") +')'
        };
    });
    
});
lookup.operations = [];

lookup.operationsPush = function(some)
{
    lookup.operations.push(some);
    var toSerialize = {};
    for (const [key, value] of Object.entries(lookup.customObjects)) {
        var toAdd = {};
        for (const [keyInner, valueInner] of Object.entries(value)) {
            if(typeof(valueInner) === 'function')
            {
                toAdd[keyInner] = valueInner();
            }else
            {
                toAdd[keyInner] = valueInner;
            }
        }
        toSerialize[key] = toAdd;
    }
    var data = JSON.stringify(toSerialize);
    localStorage.setItem('customObjects', data);
    // TODO: refresh functionsArray
    // on load refresh functions array
    // on load first  load data because there might not be any saved data then set default functions then if there are not present
};

lookup.loadFromStorage = function()
{
    var stored = localStorage.getItem('customObjects');
    if(typeof(stored) !== 'undefined' && stored != null)
    {
        var parsed = JSON.parse(stored);
        for (const [key, value] of Object.entries(parsed)) 
        {
            if(typeof(value.type) !== 'undefined')
            {
                if(value.type === "built-in-function")
                {
                    lookup.customObjects[key] = lookup.tryRestoreBuiltInFunction(value);
                }
                if(value.type === "built-in-function-parameter")
                {
                    lookup.customObjects[key] = value;
                }
                if(value.type === "function")
                {
                    lookup.customObjects[key] = lookup.tryRestoreFunction(value);
                }
                if(value.type === "function-usage")
                {
                    lookup.customObjects[key] = lookup.tryRestoreFunctionUsage(value);
                }
                if(value.type === "constant-int")
                {
                    lookup.customObjects[key] = value;
                }
                if(value.type === "parameter")
                {
                    lookup.customObjects[key] = value;
                }
                if(value.type === "symbol-usage")
                {
                    lookup.customObjects[key] = value;
                }
                if(value.type === "parameter-value")
                {
                    lookup.customObjects[key] = lookup.tryRestoreParameterValue(value);
                }
                
            }
        }
    }
    
};

lookup.restoreFunctionsArray = function()
{
    for (const [key, value] of Object.entries(lookup.customObjects)) 
    {
        if(typeof(value.type) !== 'undefined')
        {
            if(value.type === "built-in-function" )
            {
                lookup.functionsArray.push(value);
            }
            if(value.type === "function" )
            {
                lookup.functionsArray.push(value);
            }
        }
    }
};

lookup.tryRestoreBuiltInFunction = function(value)
{
    value.name = ko.observable(value.name);
    value.parameters = ko.observableArray(value.parameters);
    value.body = ko.observableArray(value.body);
    return value;
};

lookup.defineBuiltInFunction = function (name, parameters_list) 
{
    var toAdd ={
        id: name,
        type: "built-in-function",
        name: ko.observable(name),
        parameters: ko.observableArray([]),
        body: ko.observableArray([])
    };
    for(var k = 0; k < parameters_list.length; k++)
    {
        toAdd.parameters.push(lookup.defineBuiltInFunctionParameter(name, parameters_list[k]))
    }
    lookup.customObjects[name] = toAdd;
    
    lookup.functionsArray.push(toAdd);
};

lookup.defineBuiltInFunctionParameter = function(functionName, parameter)
{
    var id = functionName + "#" +  parameter;
    var toAdd = 
    {
        id: id ,
        type: "built-in-function-parameter",
        parameterName: parameter
    };
    lookup.customObjects[id] = toAdd;
    return id;
};


lookup.defineListOfPredefinedFunctions = function()
{
    lookup.defineBuiltInFunction("if", ["check", "if-true-run", "else-run"]);
    lookup.defineBuiltInFunction("+", ["a", "b"]);
    lookup.defineBuiltInFunction("-", ["a", "b"]);
    lookup.defineBuiltInFunction("*", ["a", "b"]);
    lookup.defineBuiltInFunction("/", ["a", "b"]);
    lookup.defineBuiltInFunction("<=", ["a", "b"]);
}

//TODO: need to parse https://en.wikipedia.org/wiki/List_of_computer_scientists
lookup.defaultNamesForFunctions =
[
    "Edsger Dijkstra",
    "Alan Turing",
    "Alan Kay",
    "Dines Bjørner",
    "John McCarthy"
];
lookup.getRandomInt = function(max) {
    return Math.floor(Math.random() * max);
  };  

lookup.createFunction = function()
{
    var guid = lookup.uuidv4();
    
    var toAdd = {
        id: guid,
        type: "function",
        name: ko.observable(lookup.defaultNamesForFunctions[this.getRandomInt(lookup.defaultNamesForFunctions.length)]),
        body: ko.observableArray([]),
        parameters: ko.observableArray([])

    };

    lookup.customObjects[guid] = toAdd;
    var operation = 
    {
        operation: "define-function",
        guid: guid
    };
    lookup.operationsPush(operation);
    lookup.functionsArray.push(toAdd);
};

lookup.tryRestoreFunction = function(value)
{
    value.name = ko.observable(value.name);
    value.parameters = ko.observableArray(value.parameters);
    value.body = ko.observableArray(value.body);
    return value;
};

lookup.defineConstantInt = function(c)
{
    var guid = lookup.uuidv4();
    
    lookup.customObjects[guid] = 
    {
        id: guid,
        type: "constant-int",
        value: c
    };

    var operation = 
    {
        operation: "define-constant-int",
        guid: guid,
        constantValue: c
    };
    lookup.operationsPush(operation);
    return guid;
};

lookup.defineSymbolUsage = function(symbol)
{
    var guid = lookup.uuidv4();
    
    lookup.customObjects[guid] = 
    {
        id: guid,
        type: "symbol-usage",
        symbolName: symbol
    };
    var operation = 
    {
        operation: "define-symbol-usage",
        guid: guid,
        symbolName: symbol
    };
    lookup.operationsPush(operation);
    return guid;
};

lookup.defineParameterValue = function(name, guidToUse, functionCallGuid)
{
    var guid = lookup.uuidv4();
    
    lookup.customObjects[guid] = 
    {
        id: guid,
        type: "parameter-value",
        name: name, 
        guidToUse: ko.observable(guidToUse),
        functionCallGuid: functionCallGuid
    };
    var operation = 
    {
        operation: "parameter-value",
        guid: guid,
        name: name, 
        functionCallGuid: functionCallGuid
    };
    lookup.operationsPush(operation);
    return guid;
};

lookup.tryRestoreParameterValue = function(value)
{
    value.guidToUse = ko.observable(value.guidToUse);
    return value;
};

lookup.defineFunctionCall = function( functionGuid)
{
    var toWorkWith = lookup.customObjects[functionGuid];
    var functionToCallName = toWorkWith.name
    var guid = lookup.uuidv4();
    
    var toAdd = {
        id: guid,
        type: "function-usage",
        functionName: functionToCallName,
        functionGuid: functionGuid,
        parameters: []
    };
    for(var k = 0; k < toWorkWith.parameters().length; k++)
    {
        var parameterValue = lookup.defineParameterValue(toWorkWith.parameters()[k], undefined, guid);
        toAdd.parameters.push(parameterValue);
    }

    
    lookup.customObjects[guid] = toAdd;

    var operation = 
    {
        operation: "define-function-call",
        guid: guid,
        functionName: functionToCallName,
        functionGuid: functionGuid
    };
    lookup.operationsPush(operation);

    return guid;
};


lookup.tryRestoreFunctionUsage = function(value)
{
    for (const [key, parameterValue] of Object.entries(value.parameters)) 
    {
        parameterValue.guidToUse = ko.observable(parameterValue.guidToUse);
    }
    return value;
};


lookup.defineParameter = function(parameter)
{
    var guid = lookup.uuidv4();
    
    lookup.customObjects[guid] = 
    {
        id: guid,
        type: "parameter",
        parameterName: parameter
    };
    var operation = 
    {
        operation: "define-parameter",
        guid: guid,
        parameterName: parameter
    };
    lookup.operationsPush(operation);
    return guid;
}


lookup.uuidv4 = function() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  };

lookup.activeOperation = ko.observable("");


lookup.focusedObj = ko.observable({});

lookup.focusOnBody = function(obj)
{
    lookup.focusedObj(obj);
    lookup.activeOperation("focusOnBody");

};

lookup.focusOnParameter = function(obj)
{
    lookup.focusedObj(lookup.customObjects[obj]);
    lookup.activeOperation("focusOnParameter");

};

lookup.constantIntValue = ko.observable(0);
lookup.addConstant = function()
{
    var guid = lookup.defineConstantInt(lookup.constantIntValue());
    var obj = lookup.focusedObj();
    if(lookup.activeOperation() === "focusOnBody" )
    {
        lookup.customObjects[obj.id].body.push(guid);
        var operation = 
        {
            operation: "push-to-function-body",
            guidToPush: guid,
            functionGuid: obj.id
        };
        lookup.operationsPush(operation);
    }
    if(lookup.activeOperation() === "focusOnParameter" )
    {
        obj.guidToUse(guid);
        var operation = 
        {
            operation: "set-parameter-value",
            guidToUse: guid,
            parameterValueGuid: obj.id
        };
        lookup.operationsPush(operation);
    }
    lookup.activeOperation("");

};

lookup.functionToAdd = ko.observable();
lookup.addFunction = function()
{
    var obj = lookup.focusedObj();
    var guid = lookup.defineFunctionCall(lookup.functionToAdd().id);
    if(lookup.activeOperation() === "focusOnBody" )
    {
        lookup.customObjects[obj.id].body.push(guid);
        var operation = 
        {
            operation: "push-to-function-body",
            guidToPush: guid,
            functionGuid: obj.id
        };
        lookup.operationsPush(operation);
    }
    if(lookup.activeOperation() === "focusOnParameter" )
    {
        obj.guidToUse(guid);
        var operation = 
        {
            operation: "set-parameter-value",
            guidToUse: guid,
            parameterValueGuid: obj.id
        };
        lookup.operationsPush(operation);
    }
    lookup.activeOperation("");

};

lookup.symbolToAdd = ko.observable("");

lookup.addSymbol = function()
{
    var obj = lookup.focusedObj();
    var guid = lookup.defineSymbolUsage(lookup.symbolToAdd());
    if(lookup.activeOperation() === "focusOnBody" )
    {
        lookup.customObjects[obj.id].body.push(guid);
        var operation = 
        {
            operation: "push-to-function-body",
            guidToPush: guid,
            functionGuid: obj.id
        };
        lookup.operationsPush(operation);
    }
    if(lookup.activeOperation() === "focusOnParameter" )
    {
        obj.guidToUse(guid);
        var operation = 
        {
            operation: "set-parameter-value",
            guidToUse: guid,
            parameterValueGuid: obj.id
        };
        lookup.operationsPush(operation);
    }
    lookup.activeOperation("");
};

lookup.activateRenameFunctionTool = function(obj)
{
    lookup.focusedObj(obj);
    lookup.activeOperation("activateRenameFunctionTool");
    lookup.newFunctionName(obj.name());
};

lookup.renameFunction = function()
{
    var obj = lookup.focusedObj();
    
    var operation = 
    {
        operation: "rename-function",
        functionGuid: obj.id,
        newName: lookup.newFunctionName(),
        oldName: obj.name()
    };

    obj.name(lookup.newFunctionName());

    lookup.operationsPush(operation);
    lookup.activeOperation("");


};

lookup.newFunctionName = ko.observable("");

lookup.activateAddingParameterTool = function(obj)
{
    lookup.focusedObj(obj);
    lookup.activeOperation("activateAddingParameterTool");
    lookup.newParameterName("");
    //TODO: find undefined symbols in a function to suggest them
    //TODO: find undefined symbols in a subtree when adding (let x someting)
};

lookup.addParameter = function()
{
    var obj = lookup.focusedObj();
    var toAdd = lookup.defineParameter(lookup.newParameterName());
    obj.parameters.push(toAdd);
    
    var operation = 
    {
        operation: "added-parameter-to-function",
        functionGuid: obj.id,
        parameterGuid: toAdd.id
    };
    lookup.operationsPush(operation);
    lookup.newParameterName("");
    lookup.activeOperation("");
};

lookup.newParameterName = ko.observable("");

  function AstLispyViewModel()
  {
    var self = this;

    self.ApplyLookupToSelf = function()
    {
        for(var x in lookup)
        {
            self[x] = lookup[x];
        }
    };

  };



$(document).ready(function()
{
    var viewModel = new AstLispyViewModel();
    lookup.loadFromStorage();
    viewModel.ApplyLookupToSelf();
    if(typeof(lookup.customObjects["if"]) === 'undefined' )
    {
        lookup.defineListOfPredefinedFunctions();
    }
    else
    {
        lookup.restoreFunctionsArray();
    }
    
    ko.applyBindings(viewModel);
});
  