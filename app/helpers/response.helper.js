

function errorResponse(res, err, status, msg) {
    res.status(status || 501).json({
        statusCode: 2,
        success: false,
        message: msg || 'Server Error, Please Try Again Later',
        devInfo: err
    });
}

function successPostResponse(res, data, msg) {
    res.status(200).json({
        statusCode: 3,
        success: true,
        message: msg || 'Success',
        result: data
    });
}

function unsuccessPostResponse(res, data, msg) {
    res.status(200).json({
        statusCode: 4,
        success: false,
        message: msg || 'Success',
        result: null
    });
}

function successGetResponse(res, data, msg) {
    res.status(200).json({
        statusCode: 3,
        success: true,
        message: msg || 'Success',
        result: data
    });
}

function unsuccessGetResponse(res, data, msg) {
    res.status(200).json({
        statusCode: 4,
        success: false,
        message: msg || 'Success',
        result: data
    });
}

function noRecordsFound(res, msg) {
    res.status(404).json({
        statusCode: 4,
        success: false,
        message: msg || 'Unable to find required information',
        result: null
    });
}


function unauthorized(res, msg) {
    res.status(401).json({
        statusCode: 8,
        success: false,
        message: msg || 'User Is Not Allowed',
        result: null
    });
}

module.exports = { errorResponse, successPostResponse, unsuccessPostResponse, successGetResponse, unsuccessGetResponse, noRecordsFound, unauthorized }