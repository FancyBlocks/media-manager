/**
 * External dependencies
 */
import { values } from 'lodash';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { getBlockSupport, createBlock, getBlockType } from '@wordpress/blocks';
import { useState, useCallback, Fragment } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { Placeholder, Panel, Button, Toolbar } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { store as mediaManagerStore } from '../../store';
import { MEDIA_NOT_DEFINED } from '../../store/constants';
import MediaSelector, { MediaItemPanelBody } from '../../components/media-selector/';

const useInsertMediaBlock = () => {
	const { insertBlock } = useDispatch( blockEditorStore );

	return useCallback( async ( blockType = 'core/video', clientId, index = 0 ) => {
		const mediaBlock = await createBlock( blockType );
		await insertBlock( mediaBlock, index, clientId, false );
	}, [ insertBlock ] );
};

export const SUPPORT_NAME = 'media-manager/media-selector';

export function withMediaSelector( OriginalBlock ) {
	return function ( props ) {
		const { attributes, setAttributes, clientId, name } = props;
		const [ isReplacing, setIsReplacing ] = useState( false );

		const { sourceId } = attributes;
		const { mediaSources } = useSelect( ( select ) => {
			return {
				mediaSources: select( mediaManagerStore ).getMediaSources(),
			};
		}, [] );

		
		const { mediaSource } = useSelect( ( select ) => {
			return {
				mediaSource: select( mediaManagerStore ).getMediaSourceById( sourceId )
			};
		}, [ sourceId ] );

		
		const setSourceId = ( sourceId ) => setAttributes( { sourceId } );
		const insertMediaBlock = useInsertMediaBlock();

		function insertEmptyMediaBlock( type ) {
			setSourceId( MEDIA_NOT_DEFINED );
			setIsReplacing( false );
			insertMediaBlock( type, clientId )
		}
		
		const {
			title: label,
			description: instructions,
			icon,
		} = getBlockType( name );
	
		if ( isReplacing || ! sourceId ) {
			return (
				<div className="media-selector-placeholder">
					<Placeholder
						icon={ icon.src }
						label={ label }
						instructions={ instructions }
					>
						<MediaSelector
							media={ values( mediaSources ) }
							onMediaSelect={ ( id ) => {
								setSourceId( id );
								setIsReplacing( false );
							} }
						/>
	
						<Button
							isSecondary
							label={ __( 'Continue adding a video block', 'media-manager' ) }
							onClick={ () => insertEmptyMediaBlock( 'core/video' ) }
						>
							{ __( 'Start with Video block', 'media-manager' ) }
						</Button>
	
						<Button
							isSecondary
							label={ __( 'Continue adding a audio block', 'media-manager' ) }
							onClick={ () => insertEmptyMediaBlock( 'core/audio' ) }
						>
							{ __( 'Start with an Audio block', 'media-manager' ) }
						</Button>
	
						{ ( isReplacing && sourceId !== MEDIA_NOT_DEFINED ) && (
							<Button
								isTertiary
								label={ __( 'Cancel replacing media source', 'media-manager' ) }
								onClick={ () => setIsReplacing( false ) }
							>
								{ __( 'Cancel replacement', 'media-manager' ) }
							</Button>
						) }
	
						{ ( ! isReplacing || sourceId === MEDIA_NOT_DEFINED ) && (
							<Button
								isTertiary
								label={ __( 'Continue without media source', 'media-manager' ) }
								onClick={ () => {
									setIsReplacing( false );
									setSourceId( MEDIA_NOT_DEFINED );
								} }
							>
								{ __( 'Skip', 'media-manager' ) }
							</Button>
						) }
					</Placeholder>
				</div>
			);
		}

		return (
			<Fragment>
				<BlockControls>
					<Toolbar>
						<Button onClick={ () => setIsReplacing( true ) }>
							{
								( sourceId !== MEDIA_NOT_DEFINED )
									? __( 'Replace', 'media-manager' )
									: __( 'Link', 'media-manager' )
							}
						</Button>
					</Toolbar>
				</BlockControls>

				<InspectorControls>
					<Panel>
						<MediaItemPanelBody
							source={ mediaSource }
							mediaSourceId={ sourceId }
							onReplace={ setIsReplacing }
							onUnlink={ () => setSourceId( null ) }
						/>
					</Panel>
				</InspectorControls>
				<OriginalBlock { ...props } />
			</Fragment>
		);
	}
}

function addMediaSelectorSupport( settings ) {
	if ( ! getBlockSupport( settings, SUPPORT_NAME ) ) {
		return settings;
	}

	return {
		...settings,
		attributes: {
			...settings.attributes,
			sourceId: {
				type: 'string',
			},
		},
		edit: withMediaSelector( settings.edit ),
	}
}

addFilter(
	'blocks.registerBlockType',
	'media-manager/register-media-selector-blocks',
	addMediaSelectorSupport,
);
